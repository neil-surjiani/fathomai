/**
 * Fathom AI service layer.
 *
 * Each capability is a separate, replaceable function. Nothing here knows about
 * HTTP or React — server functions compose these.
 */

import { chat, chatJson, MODELS } from "./gateway.server";
import type { ResourceCandidate } from "../providers/index.server";

export type GoalContext = {
  title: string;
  rawInput: string;
  desiredOutcome: string;
  level: string;
  minutesPerDay: number;
  daysPerWeek: number;
  deadline?: string | null;
  budget: string;
  formats: string[];
};

export type BlueprintSkill = {
  name: string;
  summary: string;
  importance: "essential" | "recommended" | "optional" | "advanced";
  estimated_minutes: number;
  prerequisites?: string[];
  subskills?: Array<{
    name: string;
    summary: string;
    importance: "essential" | "recommended" | "optional" | "advanced";
    estimated_minutes: number;
    concepts: string[];
  }>;
};

export type Blueprint = {
  normalized_title: string;
  description: string;
  reasoning: string;
  skills: BlueprintSkill[];
};

function goalPrompt(g: GoalContext) {
  return `Learner goal (raw): ${g.rawInput}
Interpreted title: ${g.title}
Desired outcome: ${g.desiredOutcome}
Current level: ${g.level}
Time: ${g.minutesPerDay} minutes/day, ${g.daysPerWeek} days/week
Deadline: ${g.deadline ?? "none"}
Budget: ${g.budget}
Preferred formats: ${g.formats.join(", ") || "mixed"}`;
}

export async function generateLearningBlueprint(g: GoalContext): Promise<Blueprint> {
  return chatJson<Blueprint>(
    [
      {
        role: "system",
        content:
          "You are an expert curriculum designer. You decompose a learning goal into the MINIMUM EFFECTIVE set of skills needed to reach the learner's stated outcome — nothing more. " +
          "Classify every item as essential, recommended, optional or advanced. Essential means the outcome is impossible without it. " +
          "Be ruthless: a 45-minute-a-day learner cannot absorb an encyclopedia. Aim for 4-7 top-level skills, each with 2-5 subskills, each subskill with 2-5 concrete concepts.",
      },
      {
        role: "user",
        content: `${goalPrompt(g)}

Return JSON:
{"normalized_title": short goal title,
 "description": one-sentence description of what the learner will be able to do,
 "reasoning": 2-3 sentences explaining what you deliberately left out and why,
 "skills":[{"name","summary","importance","estimated_minutes","prerequisites":[skill names],
   "subskills":[{"name","summary","importance","estimated_minutes","concepts":[strings]}]}]}`,
      },
    ],
    { model: MODELS.reasoning, temperature: 0.4 },
  );
}

export type RankedSelection = {
  selected: Array<{ url: string; reason: string; coverage: number; order: number }>;
  rationale: string;
};

export async function rankResources(
  ctx: { goalTitle: string; concept: string; concepts: string[]; level: string; formats: string[]; budget: string; minutesPerDay: number },
  candidates: ResourceCandidate[],
): Promise<RankedSelection> {
  if (candidates.length === 0) return { selected: [], rationale: "No verified resources found." };
  const list = candidates
    .map(
      (c, i) =>
        `${i + 1}. ${c.title} — ${c.provider} — ${c.resource_type} — ${c.price} — ${c.difficulty} — ${c.duration_minutes ?? "?"} min — ${c.url}${c.description ? ` — ${c.description}` : ""}`,
    )
    .join("\n");

  return chatJson<RankedSelection>(
    [
      {
        role: "system",
        content:
          "You select the SMALLEST set of resources that adequately covers a concept. Score on relevance, authority, clarity, difficulty fit, time efficiency, practical value, freshness, learner format preference, cost and redundancy — never popularity. " +
          "Never select two resources that teach the same thing. Prefer one conceptual source + one practical source + one hands-on exercise. Total selected time should fit inside 1-2 study sessions.",
      },
      {
        role: "user",
        content: `Goal: ${ctx.goalTitle}
Concept: ${ctx.concept} (${ctx.concepts.join(", ")})
Level: ${ctx.level} | Formats: ${ctx.formats.join(", ") || "mixed"} | Budget: ${ctx.budget} | Session length: ${ctx.minutesPerDay} min

Candidates:
${list}

Return JSON: {"selected":[{"url","reason" (why THIS resource, referencing coverage and time vs alternatives),"coverage" (0-1 fraction of the concept it covers),"order" (1-based study order)}],"rationale":"one sentence on how the set fits together"}
Select at most 3.`,
      },
    ],
    { model: MODELS.reasoning, temperature: 0.3 },
  );
}

export type RoadmapModule = {
  week_number: number;
  title: string;
  objective: string;
  skill_name: string;
  concepts: string[];
  importance: "essential" | "recommended" | "optional" | "advanced";
  estimated_minutes: number;
};

export async function generateRoadmap(
  g: GoalContext,
  blueprint: Blueprint,
): Promise<{ modules: RoadmapModule[]; total_hours: number; weeks: number }> {
  const skills = blueprint.skills
    .map(
      (s) =>
        `${s.name} [${s.importance}, ~${s.estimated_minutes}m]: ` +
        (s.subskills ?? []).map((ss) => `${ss.name} (${ss.concepts.join("/")})`).join("; "),
    )
    .join("\n");

  return chatJson(
    [
      {
        role: "system",
        content:
          "You sequence a minimum-effective curriculum into weekly modules that respect prerequisites and the learner's real weekly capacity. Modules must be achievable, not aspirational.",
      },
      {
        role: "user",
        content: `${goalPrompt(g)}

Skill tree:
${skills}

Weekly capacity: ${g.minutesPerDay * g.daysPerWeek} minutes.
Include only essential and recommended material in the default path (optional/advanced can be omitted).
Return JSON: {"modules":[{"week_number","title","objective","skill_name","concepts":[strings],"importance","estimated_minutes"}],"total_hours" (number),"weeks" (number)}`,
      },
    ],
    { model: MODELS.reasoning, temperature: 0.35 },
  );
}

export type DailyPlanItem = { minutes: number; kind: "review" | "learn" | "practice" | "reflect" | "project"; title: string; detail: string };

export async function generateDailyPlan(input: {
  goalTitle: string;
  minutes: number;
  module: { title: string; objective: string; concepts: string[] } | null;
  weakConcepts: Array<{ concept: string; mastery: number }>;
  daysSinceLastSession: number;
  deadline?: string | null;
  resources: Array<{ title: string; url: string; duration_minutes: number | null }>;
}): Promise<{ objective: string; items: DailyPlanItem[] }> {
  return chatJson(
    [
      {
        role: "system",
        content:
          "You build one focused study session. The sum of item minutes must be EXACTLY the available minutes, never more. Include spaced review of weak concepts, one learning block, one practice block, and a short retrieval/reflection block.",
      },
      {
        role: "user",
        content: `Goal: ${input.goalTitle}
Available: ${input.minutes} minutes
Current module: ${input.module ? `${input.module.title} — ${input.module.objective} (concepts: ${input.module.concepts.join(", ")})` : "none yet"}
Weak concepts: ${input.weakConcepts.map((w) => `${w.concept} (${Math.round(w.mastery * 100)}%)`).join(", ") || "none yet"}
Days since last session: ${input.daysSinceLastSession}
Deadline: ${input.deadline ?? "none"}
Selected resources: ${input.resources.map((r) => `${r.title} (${r.duration_minutes ?? "?"}m)`).join(" | ") || "none"}

Return JSON: {"objective":"one sentence outcome for today","items":[{"minutes","kind","title","detail"}]}`,
      },
    ],
    { model: MODELS.reasoning, temperature: 0.4 },
  );
}

export type GeneratedQuestion = {
  concept: string;
  question_type: "multiple_choice" | "short_answer" | "explain" | "practical" | "code" | "scenario" | "debug";
  prompt: string;
  options?: string[];
  correct_answer?: string;
  rubric?: string;
};

export async function generateAssessment(input: {
  goalTitle: string;
  concepts: string[];
  level: string;
  count?: number;
}): Promise<{ questions: GeneratedQuestion[] }> {
  return chatJson(
    [
      {
        role: "system",
        content:
          "You write assessments that match the subject. Programming → code or debugging tasks. Photography → analyse a described image. Marketing → produce a campaign decision. Video editing → edit decisions. Maths → solve. Music → identify/compose. " +
          "Never make everything multiple choice. At most one multiple-choice item. Include at least one 'explain in your own words' item and one applied task.",
      },
      {
        role: "user",
        content: `Goal: ${input.goalTitle}
Concepts just studied: ${input.concepts.join(", ")}
Learner level: ${input.level}
Write ${input.count ?? 4} questions.
Return JSON: {"questions":[{"concept","question_type","prompt","options" (only for multiple_choice),"correct_answer" (for multiple_choice/short_answer),"rubric" (what a strong answer must contain)}]}`,
      },
    ],
    { model: MODELS.reasoning, temperature: 0.5 },
  );
}

export async function evaluateAnswer(input: {
  goalTitle: string;
  question: { prompt: string; question_type: string; rubric?: string | null; correct_answer?: string | null };
  response: string;
}): Promise<{ score: number; correct: boolean; feedback: string }> {
  return chatJson(
    [
      {
        role: "system",
        content:
          "You are a demanding but fair tutor. Grade the answer 0-1. Feedback must name the SPECIFIC mistake and the specific next action. Never write generic praise like 'Great job, keep practising'. Max 3 sentences.",
      },
      {
        role: "user",
        content: `Goal: ${input.goalTitle}
Question (${input.question.question_type}): ${input.question.prompt}
Expected/rubric: ${input.question.rubric ?? input.question.correct_answer ?? "use expert judgement"}
Learner answer: ${input.response || "(blank)"}

Return JSON: {"score" (0-1),"correct" (boolean),"feedback"}`,
      },
    ],
    { model: MODELS.reasoning, temperature: 0.2 },
  );
}

export type GeneratedNote = {
  concept: string;
  explanation: string;
  key_points: string[];
  examples: string[];
  common_mistakes: string[];
  related_concepts: string[];
};

export async function generateNotes(input: {
  goalTitle: string;
  concepts: string[];
  material?: string;
  existing?: Array<{ concept: string; explanation: string | null }>;
}): Promise<{ notes: GeneratedNote[] }> {
  return chatJson(
    [
      {
        role: "system",
        content:
          "You turn messy input into a structured personal knowledge base. Be concise and concrete. If a concept already exists, IMPROVE and merge it rather than duplicating. Never invent facts not implied by the material or the subject.",
      },
      {
        role: "user",
        content: `Goal: ${input.goalTitle}
Concepts: ${input.concepts.join(", ")}
Existing notes: ${input.existing?.map((e) => `${e.concept}: ${(e.explanation ?? "").slice(0, 200)}`).join(" || ") || "none"}
${input.material ? `Raw material to structure:\n${input.material.slice(0, 12000)}` : "No raw material — write concise reference notes for the concepts."}

Return JSON: {"notes":[{"concept","explanation" (2-5 sentences),"key_points","examples","common_mistakes","related_concepts"}]}`,
      },
    ],
    { model: MODELS.reasoning, temperature: 0.35 },
  );
}

export async function generateProject(input: {
  goalTitle: string;
  skills: string[];
  level: string;
  minutesAvailable: number;
}): Promise<{ title: string; brief: string; skills_practiced: string[]; requirements: string[]; estimated_minutes: number; difficulty: string }> {
  return chatJson(
    [
      {
        role: "system",
        content:
          "You design a single small, real, shippable project that forces application of the given skills. No toy busywork. Requirements must be checkable.",
      },
      {
        role: "user",
        content: `Goal: ${input.goalTitle}
Skills to practise: ${input.skills.join(", ")}
Level: ${input.level}
Roughly ${input.minutesAvailable} minutes of work total.
Return JSON: {"title","brief","skills_practiced","requirements","estimated_minutes","difficulty"}`,
      },
    ],
    { model: MODELS.reasoning, temperature: 0.6 },
  );
}

export async function generateTutorResponse(input: {
  goalTitle: string;
  question: string;
  roadmap: string;
  mastery: string;
  notes: string;
  recentMistakes: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<string> {
  return chat(
    [
      {
        role: "system",
        content: `You are the learner's personal tutor for one specific goal: ${input.goalTitle}. You know their roadmap, mastery and notes — use them. Reference what they already learned. Be direct and short (under 200 words unless they ask for depth). Offer a concrete next step or a question back. Never behave like a generic assistant, never pad with pleasantries.

Roadmap: ${input.roadmap}
Mastery: ${input.mastery}
Their notes: ${input.notes}
Recent mistakes: ${input.recentMistakes}`,
      },
      ...input.history.slice(-8),
      { role: "user", content: input.question },
    ],
    { model: MODELS.reasoning, temperature: 0.5 },
  );
}

export async function adaptRoadmap(input: {
  goalTitle: string;
  modules: Array<{ id: string; title: string; status: string; mastery: number; concepts: string[] }>;
  mastery: Array<{ concept: string; mastery: number; attempts: number }>;
  daysMissed: number;
  minutesPerWeek: number;
  deadline?: string | null;
}): Promise<{ changes: Array<{ module_id: string; action: "skip" | "reinforce" | "keep" | "reorder"; note: string }>; summary: string }> {
  return chatJson(
    [
      {
        role: "system",
        content:
          "You adapt a roadmap to real performance. High mastery + few attempts → skip reinforcement. Repeated failure → reinforce with prerequisites and extra practice. Missed days → resequence. Only propose changes you can justify.",
      },
      {
        role: "user",
        content: `Goal: ${input.goalTitle}
Modules: ${input.modules.map((m) => `${m.id}|${m.title}|${m.status}|${Math.round(m.mastery * 100)}%`).join("\n")}
Concept mastery: ${input.mastery.map((m) => `${m.concept}:${Math.round(m.mastery * 100)}%/${m.attempts} attempts`).join(", ")}
Days missed: ${input.daysMissed} | Weekly capacity: ${input.minutesPerWeek} min | Deadline: ${input.deadline ?? "none"}

Return JSON: {"changes":[{"module_id","action","note"}],"summary"}`,
      },
    ],
    { model: MODELS.reasoning, temperature: 0.3 },
  );
}

/** Deterministic mastery model — not an AI call. */
export function updateMastery(prev: {
  exposure: number;
  practice: number;
  assessment_score: number;
  recall: number;
  application: number;
  confidence: number;
}): number {
  const w = { exposure: 0.15, recall: 0.2, assessment_score: 0.25, application: 0.25, practice: 0.1, confidence: 0.05 };
  const raw =
    prev.exposure * w.exposure +
    prev.recall * w.recall +
    prev.assessment_score * w.assessment_score +
    prev.application * w.application +
    prev.practice * w.practice +
    prev.confidence * w.confidence;
  return Math.max(0, Math.min(1, Number(raw.toFixed(3))));
}
