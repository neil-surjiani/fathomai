/**
 * Orchestration layer: composes the AI services, the resource providers and the
 * database into the end-to-end learning pipeline.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

import {
  adaptRoadmap,
  evaluateAnswer,
  generateAssessment,
  generateDailyPlan,
  generateLearningBlueprint,
  generateNotes,
  generateProject,
  generateRoadmap,
  generateTutorResponse,
  rankResources,
  updateMastery,
  type Blueprint,
  type GoalContext,
} from "./ai/services.server";
import { discoverResources, type ResourceCandidate } from "./providers/index.server";

type DB = SupabaseClient<Database>;

export type GoalInput = {
  rawInput: string;
  desiredOutcome: string;
  currentLevel: string;
  minutesPerDay: number;
  daysPerWeek: number;
  deadline: string | null;
  budget: string;
  formats: string[];
};

function ctxOf(input: GoalInput, title: string): GoalContext {
  return {
    title,
    rawInput: input.rawInput,
    desiredOutcome: input.desiredOutcome,
    level: input.currentLevel,
    minutesPerDay: input.minutesPerDay,
    daysPerWeek: input.daysPerWeek,
    deadline: input.deadline,
    budget: input.budget,
    formats: input.formats,
  };
}

export async function ensureProfile(
  db: DB,
  user: { id: string; email?: string | null; full_name?: string | null; avatar_url?: string | null },
) {
  const { data } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (data) return data;
  const { data: created, error } = await db
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name: user.full_name ?? null,
      avatar_url: user.avatar_url ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return created;
}

function ctxOfGoal(goal: Database["public"]["Tables"]["learning_goals"]["Row"]): GoalContext {
  return {
    title: goal.title,
    rawInput: goal.raw_input ?? goal.title,
    desiredOutcome: goal.desired_outcome ?? "",
    level: goal.current_level ?? "beginner",
    minutesPerDay: goal.minutes_per_day,
    daysPerWeek: goal.days_per_week,
    deadline: goal.deadline,
    budget: goal.budget,
    formats: goal.preferred_formats,
  };
}

/**
 * Stage 1 — interpret the goal, decompose it into a skill tree and persist it.
 * Split from the later stages so the UI can report real progress, not fake percentages.
 */
export async function stageBlueprint(db: DB, userId: string, input: GoalInput) {
  const blueprint: Blueprint = await generateLearningBlueprint(ctxOf(input, input.rawInput));
  const title = blueprint.normalized_title || input.rawInput.slice(0, 80);

  const { data: goal, error: goalErr } = await db
    .from("learning_goals")
    .insert({
      user_id: userId,
      title,
      description: blueprint.description,
      raw_input: input.rawInput,
      desired_outcome: input.desiredOutcome,
      current_level: input.currentLevel,
      minutes_per_day: input.minutesPerDay,
      days_per_week: input.daysPerWeek,
      deadline: input.deadline,
      budget: input.budget,
      preferred_formats: input.formats,
      blueprint: (blueprint ?? {}) as unknown as NonNullable<Database["public"]["Tables"]["learning_goals"]["Insert"]["blueprint"]>,
      generation_state: "building",
    })
    .select()
    .single();
  if (goalErr) throw goalErr;

  // Skills + subskills
  const skillIdByName = new Map<string, string>();
  let order = 0;
  for (const s of blueprint.skills ?? []) {
    const { data: parent } = await db
      .from("skills")
      .insert({
        goal_id: goal.id,
        user_id: userId,
        name: s.name,
        summary: s.summary,
        importance: s.importance,
        estimated_minutes: s.estimated_minutes ?? 60,
        sort_order: order++,
      })
      .select("id")
      .single();
    if (!parent) continue;
    skillIdByName.set(s.name.toLowerCase(), parent.id);
    let sub = 0;
    for (const ss of s.subskills ?? []) {
      await db.from("skills").insert({
        goal_id: goal.id,
        user_id: userId,
        parent_id: parent.id,
        name: ss.name,
        summary: ss.summary,
        importance: ss.importance,
        estimated_minutes: ss.estimated_minutes ?? 45,
        sort_order: sub++,
      });
    }
  }

  return {
    goalId: goal.id,
    title,
    skills: (blueprint.skills ?? []).length,
    reasoning: blueprint.reasoning ?? "",
    skillIds: Object.fromEntries(skillIdByName),
  };
}

/** Stage 2 — sequence the skill tree into weekly modules and schedule them. */
export async function stageRoadmap(db: DB, userId: string, goalId: string) {
  const { data: goal, error } = await db.from("learning_goals").select("*").eq("id", goalId).single();
  if (error || !goal) throw new Error("Goal not found");
  const blueprint = goal.blueprint as unknown as Blueprint;
  const ctx = ctxOfGoal(goal);

  const { data: skillRows } = await db.from("skills").select("id, name").eq("goal_id", goalId);
  const skillIdByName = new Map((skillRows ?? []).map((s) => [s.name.toLowerCase(), s.id]));

  const roadmap = await generateRoadmap(ctx, blueprint);
  const modules = (roadmap.modules ?? []).slice(0, 24);
  const insertedModules: Array<{ id: string; concepts: string[]; title: string; week: number }> = [];
  for (const [i, m] of modules.entries()) {
    const { data: mod } = await db
      .from("modules")
      .insert({
        goal_id: goalId,
        user_id: userId,
        skill_id: skillIdByName.get((m.skill_name ?? "").toLowerCase()) ?? null,
        week_number: m.week_number ?? 1,
        sort_order: i,
        title: m.title,
        objective: m.objective,
        concepts: m.concepts ?? [],
        importance: m.importance ?? "essential",
        estimated_minutes: m.estimated_minutes ?? 60,
      })
      .select("id, concepts, title, week_number")
      .single();
    if (mod) insertedModules.push({ id: mod.id, concepts: mod.concepts, title: mod.title, week: mod.week_number });
  }

  const concepts = [...new Set(insertedModules.flatMap((m) => m.concepts))];
  if (concepts.length) {
    await db.from("concept_mastery").upsert(
      concepts.map((c) => ({ user_id: userId, goal_id: goalId, concept: c })),
      { onConflict: "goal_id,concept" },
    );
  }

  const totalMinutes = modules.reduce((a, m) => a + (m.estimated_minutes ?? 60), 0);
  const weeklyMinutes = Math.max(1, goal.minutes_per_day * goal.days_per_week);
  const days = Math.ceil((totalMinutes / weeklyMinutes) * 7);
  const eta = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

  await db
    .from("learning_goals")
    .update({
      estimated_total_hours: Number((totalMinutes / 60).toFixed(1)),
      estimated_completion_date: eta,
    })
    .eq("id", goalId);

  return {
    modules: insertedModules.length,
    weeks: Math.max(1, ...insertedModules.map((m) => m.week)),
    hours: Number((totalMinutes / 60).toFixed(1)),
    days,
    concepts: concepts.length,
  };
}

/** Stage 3 — research, verify and rank real resources for the opening modules. */
export async function stageResources(db: DB, userId: string, goalId: string) {
  const { data: goal, error } = await db.from("learning_goals").select("*").eq("id", goalId).single();
  if (error || !goal) throw new Error("Goal not found");
  const ctx = ctxOfGoal(goal);

  const { data: modules } = await db
    .from("modules")
    .select("id, title, concepts")
    .eq("goal_id", goalId)
    .order("week_number")
    .order("sort_order")
    .limit(3);

  const counts = await Promise.all(
    (modules ?? []).map((m) => attachResources(db, userId, goalId, m, ctx).catch(() => 0)),
  );

  await db.from("learning_goals").update({ generation_state: "ready" }).eq("id", goalId);
  await db.from("profiles").update({ onboarded: true }).eq("id", userId);
  await db.from("activity_log").insert({ user_id: userId, goal_id: goalId, kind: "goal_created" });

  return { resources: counts.reduce((a, b) => a + b, 0), modulesCovered: (modules ?? []).length };
}

/**
 * Ensures a module has real, verified resources attached. Used on demand from
 * the session and resources screens so a module never sits empty.
 */
export async function ensureModuleResources(
  db: DB,
  userId: string,
  goalId: string,
  moduleId?: string | null,
  force = false,
) {
  const { data: goal, error } = await db.from("learning_goals").select("*").eq("id", goalId).single();
  if (error || !goal) throw new Error("Goal not found");
  const ctx = ctxOfGoal(goal);

  let module: { id: string; title: string; concepts: string[] } | null = null;
  if (moduleId) {
    const { data } = await db.from("modules").select("id, title, concepts").eq("id", moduleId).maybeSingle();
    module = data ?? null;
  }
  if (!module) {
    const { data } = await db
      .from("modules")
      .select("id, title, concepts")
      .eq("goal_id", goalId)
      .order("week_number")
      .order("sort_order")
      .limit(1);
    module = data?.[0] ?? null;
  }
  if (!module) return { added: 0, moduleId: null as string | null };

  if (!force) {
    const { count } = await db
      .from("module_resources")
      .select("id", { count: "exact", head: true })
      .eq("module_id", module.id);
    if ((count ?? 0) > 0) return { added: 0, moduleId: module.id };
  }

  const added = await attachResources(db, userId, goalId, module, ctx);
  return { added, moduleId: module.id };
}

export async function attachResources(

  db: DB,
  userId: string,
  goalId: string,
  module: { id: string; title: string; concepts: string[] },
  ctx: GoalContext,
) {
  const candidates = await discoverResources({
    goalTitle: ctx.title,
    concept: module.title,
    concepts: module.concepts,
    level: ctx.level,
    budget: ctx.budget,
    formats: ctx.formats,
  });
  if (candidates.length === 0) return 0;

  const ranked = await rankResources(
    {
      goalTitle: ctx.title,
      concept: module.title,
      concepts: module.concepts,
      level: ctx.level,
      formats: ctx.formats,
      budget: ctx.budget,
      minutesPerDay: ctx.minutesPerDay,
    },
    candidates,
  );

  const byUrl = new Map(candidates.map((c) => [c.url.replace(/\/+$/, "").toLowerCase(), c]));
  const chosen = (ranked.selected ?? [])
    .map((s) => ({ sel: s, cand: byUrl.get(s.url.replace(/\/+$/, "").toLowerCase()) }))
    .filter((x): x is { sel: (typeof ranked.selected)[number]; cand: ResourceCandidate } => Boolean(x.cand));

  let count = 0;
  for (const { sel, cand } of chosen.slice(0, 4)) {
    const resourceId = await upsertResource(db, cand, sel.coverage ?? 0.6);
    if (!resourceId) continue;
    await db.from("module_resources").insert({
      module_id: module.id,
      resource_id: resourceId,
      user_id: userId,
      reason: sel.reason,
      coverage: sel.coverage ?? null,
      sort_order: sel.order ?? count,
    });
    count++;
  }
  void goalId;
  return count;
}

async function upsertResource(db: DB, c: ResourceCandidate, relevance: number) {
  const { data: existing } = await db.from("resources").select("id").eq("url", c.url).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await db
    .from("resources")
    .insert({
      url: c.url,
      title: c.title,
      provider: c.provider,
      resource_type: c.resource_type,
      author: (c.author ?? null) as string | null,
      duration_minutes: c.duration_minutes ?? null,
      price: c.price ?? "free",
      difficulty: c.difficulty ?? "beginner",
      topics: c.topics ?? [],
      description: c.description ?? null,
      relevance_score: relevance,
      quality_score: c.source === "documentation" ? 0.9 : 0.7,
      recency_score: 0.7,
      hands_on_score: ["practice", "interactive", "repository"].includes(c.resource_type) ? 0.9 : 0.4,
      beginner_friendliness: c.difficulty === "beginner" ? 0.9 : 0.5,
      source: c.source,
      verified: true,
    })
    .select("id")
    .single();
  if (error) {
    console.error("resource insert failed", error.message);
    return null;
  }
  return data.id;
}

/* ------------------------------- daily plan ------------------------------- */

export async function getOrCreateTodaySession(db: DB, userId: string, goalId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await db
    .from("learning_sessions")
    .select("*")
    .eq("goal_id", goalId)
    .eq("session_date", today)
    .maybeSingle();
  if (existing) return existing;

  const { data: goal } = await db.from("learning_goals").select("*").eq("id", goalId).single();
  if (!goal) throw new Error("Goal not found");

  const { data: modules } = await db
    .from("modules")
    .select("*")
    .eq("goal_id", goalId)
    .order("week_number")
    .order("sort_order");
  const active = (modules ?? []).find((m) => m.status !== "complete") ?? null;

  const { data: mastery } = await db
    .from("concept_mastery")
    .select("concept, mastery")
    .eq("goal_id", goalId)
    .order("mastery")
    .limit(3);

  const { data: last } = await db
    .from("learning_sessions")
    .select("session_date")
    .eq("goal_id", goalId)
    .order("session_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  const daysSince = last
    ? Math.round((Date.now() - new Date(last.session_date).getTime()) / 86400000)
    : 0;

  let resources: Array<{ title: string; url: string; duration_minutes: number | null }> = [];
  if (active) {
    const { data: mr } = await db
      .from("module_resources")
      .select("resources(title, url, duration_minutes)")
      .eq("module_id", active.id)
      .order("sort_order");
    resources = (mr ?? []).flatMap((r) => (r.resources ? [r.resources] : []));
    if (resources.length === 0) {
      await attachResources(db, userId, goalId, active, {
        title: goal.title,
        rawInput: goal.raw_input ?? goal.title,
        desiredOutcome: goal.desired_outcome ?? "",
        level: goal.current_level ?? "beginner",
        minutesPerDay: goal.minutes_per_day,
        daysPerWeek: goal.days_per_week,
        deadline: goal.deadline,
        budget: goal.budget,
        formats: goal.preferred_formats,
      });
      const { data: mr2 } = await db
        .from("module_resources")
        .select("resources(title, url, duration_minutes)")
        .eq("module_id", active.id)
        .order("sort_order");
      resources = (mr2 ?? []).flatMap((r) => (r.resources ? [r.resources] : []));
    }
  }

  const plan = await generateDailyPlan({
    goalTitle: goal.title,
    minutes: goal.minutes_per_day,
    module: active ? { title: active.title, objective: active.objective ?? "", concepts: active.concepts } : null,
    weakConcepts: mastery ?? [],
    daysSinceLastSession: daysSince,
    deadline: goal.deadline,
    resources,
  });

  const items = (plan.items ?? []).slice(0, 6);
  const sum = items.reduce((a, i) => a + (i.minutes ?? 0), 0);
  if (sum > goal.minutes_per_day && sum > 0) {
    const scale = goal.minutes_per_day / sum;
    for (const i of items) i.minutes = Math.max(5, Math.round((i.minutes ?? 0) * scale));
  }

  const { data: created, error } = await db
    .from("learning_sessions")
    .insert({
      user_id: userId,
      goal_id: goalId,
      module_id: active?.id ?? null,
      session_date: today,
      objective: plan.objective,
      plan: (items ?? []) as unknown as NonNullable<Database["public"]["Tables"]["learning_sessions"]["Insert"]["plan"]>,
      planned_minutes: goal.minutes_per_day,
    })
    .select()
    .single();
  if (error) throw error;
  return created;
}

/* ------------------------------ assessments ------------------------------- */

export async function createAssessment(
  db: DB,
  userId: string,
  args: { goalId: string; moduleId?: string | null; sessionId?: string | null; concepts?: string[] },
) {
  const { data: goal } = await db.from("learning_goals").select("*").eq("id", args.goalId).single();
  if (!goal) throw new Error("Goal not found");

  let concepts = args.concepts ?? [];
  if (concepts.length === 0 && args.moduleId) {
    const { data: mod } = await db.from("modules").select("concepts").eq("id", args.moduleId).maybeSingle();
    concepts = mod?.concepts ?? [];
  }
  if (concepts.length === 0) concepts = [goal.title];

  const { questions } = await generateAssessment({
    goalTitle: goal.title,
    concepts,
    level: goal.current_level ?? "beginner",
  });

  const { data: assessment, error } = await db
    .from("assessments")
    .insert({
      user_id: userId,
      goal_id: args.goalId,
      module_id: args.moduleId ?? null,
      session_id: args.sessionId ?? null,
      concepts,
    })
    .select()
    .single();
  if (error) throw error;

  const rows = (questions ?? []).slice(0, 6).map((q, i) => ({
    assessment_id: assessment.id,
    user_id: userId,
    concept: q.concept ?? concepts[0] ?? null,
    question_type: q.question_type ?? "short_answer",
    prompt: q.prompt,
    options: q.options ?? null,
    correct_answer: q.correct_answer ?? null,
    rubric: q.rubric ?? null,
    sort_order: i,
  }));
  const { data: inserted } = await db.from("questions").insert(rows).select();
  return { assessment, questions: inserted ?? [] };
}

export async function submitAssessment(
  db: DB,
  userId: string,
  args: { assessmentId: string; responses: Array<{ questionId: string; response: string }> },
) {
  const { data: assessment } = await db
    .from("assessments")
    .select("*, learning_goals(title)")
    .eq("id", args.assessmentId)
    .single();
  if (!assessment) throw new Error("Assessment not found");
  const { data: questions } = await db.from("questions").select("*").eq("assessment_id", args.assessmentId);

  const graded = await Promise.all(
    args.responses.map(async (r) => {
      const q = (questions ?? []).find((x) => x.id === r.questionId);
      if (!q) return null;
      const evaluation = await evaluateAnswer({
        goalTitle: assessment.learning_goals?.title ?? "",
        question: {
          prompt: q.prompt,
          question_type: q.question_type,
          rubric: q.rubric,
          correct_answer: q.correct_answer,
        },
        response: r.response,
      });
      await db.from("answers").insert({
        question_id: q.id,
        user_id: userId,
        response: r.response,
        correct: evaluation.correct,
        score: evaluation.score,
        feedback: evaluation.feedback,
      });
      return { questionId: q.id, concept: q.concept, ...evaluation };
    }),
  );

  const results = graded.filter((g): g is NonNullable<typeof g> => g !== null);
  const score = results.length ? results.reduce((a, r) => a + r.score, 0) / results.length : 0;

  await db
    .from("assessments")
    .update({ score, status: "complete", completed_at: new Date().toISOString() })
    .eq("id", args.assessmentId);

  // Mastery update per concept
  for (const concept of [...new Set(results.map((r) => r.concept).filter(Boolean) as string[])]) {
    const conceptResults = results.filter((r) => r.concept === concept);
    const avg = conceptResults.reduce((a, r) => a + r.score, 0) / conceptResults.length;
    await bumpMastery(db, userId, assessment.goal_id, concept, {
      assessment_score: avg,
      recall: avg,
      application: avg * 0.8,
      practice: 0.6,
      exposure: 1,
    });
  }

  if (assessment.module_id) {
    const { data: mastery } = await db
      .from("concept_mastery")
      .select("mastery, concept")
      .eq("goal_id", assessment.goal_id);
    const { data: mod } = await db.from("modules").select("concepts").eq("id", assessment.module_id).maybeSingle();
    const relevant = (mastery ?? []).filter((m) => (mod?.concepts ?? []).includes(m.concept));
    const modMastery = relevant.length ? relevant.reduce((a, m) => a + Number(m.mastery), 0) / relevant.length : score;
    await db
      .from("modules")
      .update({ mastery: modMastery, status: modMastery >= 0.7 ? "complete" : "in_progress" })
      .eq("id", assessment.module_id);
  }

  await refreshGoalMastery(db, assessment.goal_id);
  await db.from("activity_log").insert({
    user_id: userId,
    goal_id: assessment.goal_id,
    kind: "assessment_completed",
    detail: { score: score ?? 0 } as unknown as NonNullable<Database["public"]["Tables"]["activity_log"]["Insert"]["detail"]>,
  });

  return { score, results };
}

export async function bumpMastery(
  db: DB,
  userId: string,
  goalId: string,
  concept: string,
  signals: Partial<{
    exposure: number;
    practice: number;
    assessment_score: number;
    recall: number;
    application: number;
    confidence: number;
  }>,
) {
  const { data: row } = await db
    .from("concept_mastery")
    .select("*")
    .eq("goal_id", goalId)
    .eq("concept", concept)
    .maybeSingle();

  const blend = (prev: number, next?: number) =>
    next === undefined ? prev : Number((prev * 0.4 + next * 0.6).toFixed(3));

  const next = {
    exposure: blend(Number(row?.exposure ?? 0), signals.exposure),
    practice: blend(Number(row?.practice ?? 0), signals.practice),
    assessment_score: blend(Number(row?.assessment_score ?? 0), signals.assessment_score),
    recall: blend(Number(row?.recall ?? 0), signals.recall),
    application: blend(Number(row?.application ?? 0), signals.application),
    confidence: blend(Number(row?.confidence ?? 0), signals.confidence),
  };

  await db.from("concept_mastery").upsert(
    {
      ...next,
      user_id: userId,
      goal_id: goalId,
      concept,
      mastery: updateMastery(next),
      attempts: (row?.attempts ?? 0) + 1,
      last_reviewed_at: new Date().toISOString(),
    },
    { onConflict: "goal_id,concept" },
  );
}

export async function refreshGoalMastery(db: DB, goalId: string) {
  const { data } = await db.from("concept_mastery").select("mastery").eq("goal_id", goalId);
  if (!data?.length) return;
  const avg = data.reduce((a, r) => a + Number(r.mastery), 0) / data.length;
  await db.from("learning_goals").update({ mastery_score: avg }).eq("id", goalId);
}

/* --------------------------------- notes ---------------------------------- */

export async function writeNotes(
  db: DB,
  userId: string,
  args: { goalId: string; concepts: string[]; material?: string },
) {
  const { data: goal } = await db.from("learning_goals").select("title").eq("id", args.goalId).single();
  const { data: existing } = await db
    .from("notes")
    .select("concept, explanation")
    .eq("goal_id", args.goalId)
    .limit(30);

  const { notes } = await generateNotes({
    goalTitle: goal?.title ?? "",
    concepts: args.concepts,
    material: args.material ?? "",
    existing: existing ?? [],
  });

  const saved = [];
  for (const n of (notes ?? []).slice(0, 8)) {
    const { data } = await db
      .from("notes")
      .upsert(
        {
          user_id: userId,
          goal_id: args.goalId,
          concept: n.concept,
          explanation: n.explanation,
          key_points: n.key_points ?? [],
          examples: n.examples ?? [],
          common_mistakes: n.common_mistakes ?? [],
          related_concepts: n.related_concepts ?? [],
        },
        { onConflict: "user_id,goal_id,concept" },
      )
      .select()
      .single();
    if (data) saved.push(data);
  }
  return saved;
}

/* --------------------------------- tutor ---------------------------------- */

export async function askTutor(
  db: DB,
  args: { goalId: string; question: string; history: Array<{ role: "user" | "assistant"; content: string }> },
) {
  const [{ data: goal }, { data: modules }, { data: mastery }, { data: notes }, { data: answers }] =
    await Promise.all([
      db.from("learning_goals").select("title").eq("id", args.goalId).single(),
      db.from("modules").select("title, status, concepts").eq("goal_id", args.goalId).order("week_number"),
      db.from("concept_mastery").select("concept, mastery").eq("goal_id", args.goalId).order("mastery").limit(10),
      db.from("notes").select("concept, explanation").eq("goal_id", args.goalId).limit(10),
      db.from("answers").select("feedback, correct").eq("correct", false).order("created_at", { ascending: false }).limit(5),
    ]);

  return generateTutorResponse({
    goalTitle: goal?.title ?? "",
    question: args.question,
    roadmap: (modules ?? []).map((m) => `${m.title} (${m.status})`).join(" → "),
    mastery: (mastery ?? []).map((m) => `${m.concept} ${Math.round(Number(m.mastery) * 100)}%`).join(", "),
    notes: (notes ?? []).map((n) => `${n.concept}: ${(n.explanation ?? "").slice(0, 160)}`).join(" | "),
    recentMistakes: (answers ?? []).map((a) => a.feedback ?? "").join(" | "),
    history: args.history,
  });
}

/* -------------------------------- projects -------------------------------- */

export async function createProject(db: DB, userId: string, goalId: string) {
  const [{ data: goal }, { data: skills }] = await Promise.all([
    db.from("learning_goals").select("*").eq("id", goalId).single(),
    db.from("skills").select("name, importance").eq("goal_id", goalId).limit(12),
  ]);
  if (!goal) throw new Error("Goal not found");
  const p = await generateProject({
    goalTitle: goal.title,
    skills: (skills ?? []).map((s) => s.name),
    level: goal.current_level ?? "beginner",
    minutesAvailable: goal.minutes_per_day * 4,
  });
  const { data, error } = await db
    .from("projects")
    .insert({
      user_id: userId,
      goal_id: goalId,
      title: p.title,
      brief: p.brief,
      skills_practiced: p.skills_practiced ?? [],
      requirements: p.requirements ?? [],
      estimated_minutes: p.estimated_minutes ?? 120,
      difficulty: p.difficulty ?? "beginner",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* -------------------------------- adaptation ------------------------------ */

export async function adapt(db: DB, goalId: string) {
  const [{ data: goal }, { data: modules }, { data: mastery }, { data: sessions }] = await Promise.all([
    db.from("learning_goals").select("*").eq("id", goalId).single(),
    db.from("modules").select("id, title, status, mastery, concepts").eq("goal_id", goalId).order("week_number"),
    db.from("concept_mastery").select("concept, mastery, attempts").eq("goal_id", goalId),
    db.from("learning_sessions").select("session_date").eq("goal_id", goalId).order("session_date", { ascending: false }).limit(1),
  ]);
  if (!goal) throw new Error("Goal not found");

  const last = sessions?.[0]?.session_date;
  const daysMissed = last ? Math.max(0, Math.round((Date.now() - new Date(last).getTime()) / 86400000) - 1) : 0;

  const result = await adaptRoadmap({
    goalTitle: goal.title,
    modules: (modules ?? []).map((m) => ({ ...m, mastery: Number(m.mastery) })),
    mastery: (mastery ?? []).map((m) => ({ ...m, mastery: Number(m.mastery) })),
    daysMissed,
    minutesPerWeek: goal.minutes_per_day * goal.days_per_week,
    deadline: goal.deadline,
  });

  for (const change of result.changes ?? []) {
    if (change.action === "skip") {
      await db.from("modules").update({ status: "skipped" }).eq("id", change.module_id).eq("goal_id", goalId);
    }
  }

  const remaining = (modules ?? []).filter((m) => m.status !== "complete" && m.status !== "skipped");
  const weekly = Math.max(1, goal.minutes_per_day * goal.days_per_week);
  const minutesLeft = remaining.length * 60;
  const eta = new Date(Date.now() + Math.ceil((minutesLeft / weekly) * 7) * 86400000).toISOString().slice(0, 10);
  await db.from("learning_goals").update({ estimated_completion_date: eta }).eq("id", goalId);

  return result;
}

/* -------------------------------- dashboard ------------------------------- */

export async function loadDashboard(db: DB, userId: string, goalId?: string | null) {
  const { data: goals } = await db
    .from("learning_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const active = goalId
    ? (goals ?? []).find((g) => g.id === goalId)
    : (goals ?? []).find((g) => g.status === "active") ?? goals?.[0];
  if (!active) return { goals: goals ?? [], goal: null };

  const [{ data: modules }, { data: weak }, { data: notes }, { data: projects }, { data: activity }, { data: session }] =
    await Promise.all([
      db.from("modules").select("*").eq("goal_id", active.id).order("week_number").order("sort_order"),
      db.from("concept_mastery").select("concept, mastery, attempts").eq("goal_id", active.id).order("mastery").limit(3),
      db.from("notes").select("id, concept, explanation, updated_at").eq("goal_id", active.id).order("updated_at", { ascending: false }).limit(4),
      db.from("projects").select("*").eq("goal_id", active.id).order("created_at", { ascending: false }).limit(3),
      db.from("activity_log").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(60),
      db.from("learning_sessions").select("*").eq("goal_id", active.id).eq("session_date", new Date().toISOString().slice(0, 10)).maybeSingle(),
    ]);

  const { data: recentSessions } = await db
    .from("learning_sessions")
    .select("session_date, actual_minutes, status")
    .eq("user_id", userId)
    .order("session_date", { ascending: false })
    .limit(60);

  return {
    goals: goals ?? [],
    goal: active,
    modules: modules ?? [],
    weakConcepts: weak ?? [],
    notes: notes ?? [],
    projects: projects ?? [],
    activity: activity ?? [],
    todaySession: session ?? null,
    streak: computeStreak(recentSessions ?? []),
    minutesToday: (recentSessions ?? []).find((s) => s.session_date === new Date().toISOString().slice(0, 10))?.actual_minutes ?? 0,
  };
}

export function computeStreak(sessions: Array<{ session_date: string; actual_minutes: number }>) {
  const days = new Set(sessions.filter((s) => s.actual_minutes > 0).map((s) => s.session_date));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (streak === 0 && key === new Date().toISOString().slice(0, 10)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }
  return streak;
}
