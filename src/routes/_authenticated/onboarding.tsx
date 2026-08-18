import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Waves } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { GenerationStages, type Stage } from "@/components/generation-stages";
import { bootstrapProfile, buildPath, buildResourcesStage, buildRoadmapStage } from "@/lib/fathom.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your learning goal — Fathom" },
      { name: "description", content: "Answer a few questions and Fathom builds your personalised learning path." },
      { property: "og:title", content: "Set up your learning goal — Fathom" },
      { property: "og:description", content: "Goal, outcome, level, time, deadline, budget and format preferences." },
    ],
  }),
  component: Onboarding,
});

const OUTCOMES = [
  "Understand the subject",
  "Become job-ready",
  "Build projects",
  "Pass an exam",
  "Become professional",
  "Hobby",
];
const LEVELS = ["Complete beginner", "Beginner", "Intermediate", "Advanced", "Not sure"];
const BUDGETS = [
  { value: "free_only", label: "Free only" },
  { value: "mostly_free", label: "Mostly free" },
  { value: "will_pay", label: "Will pay for valuable resources" },
  { value: "no_limit", label: "No limit" },
];
const FORMATS = ["Video", "Reading", "Projects", "Exercises", "Interactive practice", "Mixed"];
const EXAMPLES = ["app development", "film editing", "music production", "machine learning"];

type Answers = {
  rawInput: string;
  outcome: string;
  customOutcome: string;
  level: string;
  minutes: number;
  days: number;
  varies: boolean;
  deadline: string;
  budget: string;
  formats: string[];
};

function Onboarding() {
  const navigate = useNavigate();
  const bootstrap = useServerFn(bootstrapProfile);
  const runBlueprint = useServerFn(buildPath);
  const runRoadmap = useServerFn(buildRoadmapStage);
  const runResources = useServerFn(buildResourcesStage);

  const [step, setStep] = useState(0);
  const [building, setBuilding] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [a, setA] = useState<Answers>({
    rawInput: "",
    outcome: "",
    customOutcome: "",
    level: "",
    minutes: 45,
    days: 5,
    varies: false,
    deadline: "",
    budget: "mostly_free",
    formats: ["Mixed"],
  });

  useEffect(() => {
    bootstrap({}).catch(() => undefined);
  }, [bootstrap]);

  const steps = useMemo(
    () => [
      { title: "What do you want to learn?", valid: a.rawInput.trim().length > 3 },
      { title: "What do you want to be able to do?", valid: Boolean(a.outcome || a.customOutcome) },
      { title: "Where are you starting from?", valid: Boolean(a.level) },
      { title: "How much time can you realistically spend?", valid: a.minutes >= 10 && a.days >= 1 },
      { title: "Do you have a target date?", valid: true },
      { title: "What's your budget for resources?", valid: Boolean(a.budget) },
      { title: "What works best for you?", valid: a.formats.length > 0 },
    ],
    [a],
  );

  const setStage = (key: string, state: Stage["state"], note?: string) =>
    setStages((prev) => prev.map((s) => (s.key === key ? { ...s, state, note: note ?? s.note } : s)));

  const build = async () => {
    setBuilding(true);
    setStages([
      { key: "goal", label: "Understanding your goal", state: "running" },
      { key: "skills", label: "Mapping required skills and prerequisites", state: "pending" },
      { key: "path", label: "Building your minimum effective path", state: "pending" },
      { key: "schedule", label: "Estimating workload and schedule", state: "pending" },
      { key: "research", label: "Searching and verifying learning resources", state: "pending" },
      { key: "rank", label: "Comparing resources and removing redundancy", state: "pending" },
    ]);

    try {
      const blueprint = await runBlueprint({
        data: {
          rawInput: a.rawInput.trim(),
          desiredOutcome: a.customOutcome || a.outcome,
          currentLevel: a.level,
          minutesPerDay: a.minutes,
          daysPerWeek: a.days,
          deadline: a.deadline || null,
          budget: a.budget,
          formats: a.formats,
        },
      });
      setStage("goal", "done", blueprint.title);
      setStage("skills", "done", `${blueprint.skills} core skills mapped`);
      setStage("path", "running");

      const roadmap = await runRoadmap({ data: { goalId: blueprint.goalId } });
      setStage("path", "done", `${roadmap.modules} modules · ${roadmap.concepts} concepts`);
      setStage("schedule", "done", `${roadmap.hours} hours · about ${roadmap.days} days at your pace`);
      setStage("research", "running");

      const res = await runResources({ data: { goalId: blueprint.goalId } });
      setStage("research", "done", `${res.resources} verified resources selected`);
      setStage("rank", "done", `Covering your first ${res.modulesCovered} modules`);

      await new Promise((r) => setTimeout(r, 700));
      navigate({ to: "/roadmap/$goalId", params: { goalId: blueprint.goalId } });
    } catch (error) {
      console.error(error);
      setStages((prev) => prev.map((s) => (s.state === "running" ? { ...s, state: "failed" } : s)));
      toast.error(error instanceof Error ? error.message : "Something went wrong building your path.");
      setBuilding(false);
    }
  };

  if (building) {
    return (
      <div className="grain flex min-h-screen items-center justify-center px-5">
        <GenerationStages stages={stages} title="Building your learning path" />
      </div>
    );
  }

  const current = steps[step]!;

  return (
    <div className="grain min-h-screen px-5 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center gap-2">
          <Waves className="size-4 text-primary" strokeWidth={2.2} />
          <span className="display text-lg">Fathom</span>
        </div>

        <div className="mb-8 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-0.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-border-strong",
              )}
            />
          ))}
        </div>

        <p className="num mb-2 text-xs text-muted-foreground">
          Step {step + 1} of {steps.length}
        </p>
        <h1 className="display text-3xl">{current.title}</h1>

        <div className="mt-8">
          {step === 0 && (
            <div className="space-y-4">
              <Textarea
                autoFocus
                rows={4}
                placeholder="I want to learn app development so I can build and publish my own mobile apps."
                value={a.rawInput}
                onChange={(e) => setA({ ...a, rawInput: e.target.value })}
                className="resize-none text-base"
              />
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setA({ ...a, rawInput: `I want to learn ${e}` })}
                    className="rounded-full border border-border-strong px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Choices options={OUTCOMES} value={a.outcome} onSelect={(v) => setA({ ...a, outcome: v, customOutcome: "" })} />
              <Input
                placeholder="Or describe your own outcome"
                value={a.customOutcome}
                onChange={(e) => setA({ ...a, customOutcome: e.target.value, outcome: "" })}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Choices options={LEVELS} value={a.level} onSelect={(v) => setA({ ...a, level: v })} />
              <p className="text-xs text-muted-foreground">
                Not sure? Pick your best guess — Fathom runs a short diagnostic assessment in your first session and
                recalibrates the path from your actual answers.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Minutes per day</span>
                  <span className="num text-xl">{a.minutes}</span>
                </div>
                <Slider
                  value={[a.minutes]}
                  min={10}
                  max={240}
                  step={5}
                  onValueChange={([v]) => setA({ ...a, minutes: v ?? 45 })}
                />
              </div>
              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Days per week</span>
                  <span className="num text-xl">{a.days}</span>
                </div>
                <Slider value={[a.days]} min={1} max={7} step={1} onValueChange={([v]) => setA({ ...a, days: v ?? 5 })} />
              </div>
              <label className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                <span className="text-sm">My available time varies by day</span>
                <Switch checked={a.varies} onCheckedChange={(v) => setA({ ...a, varies: v })} />
              </label>
              <p className="text-xs text-muted-foreground">
                That's {Math.round((a.minutes * a.days) / 60 * 10) / 10} hours per week. Daily plans will never exceed
                the time you set here.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Input type="date" value={a.deadline} onChange={(e) => setA({ ...a, deadline: e.target.value })} />
              <Button variant="ghost" size="sm" onClick={() => setA({ ...a, deadline: "" })}>
                No deadline
              </Button>
            </div>
          )}

          {step === 5 && (
            <Choices
              options={BUDGETS.map((b) => b.label)}
              value={BUDGETS.find((b) => b.value === a.budget)?.label ?? ""}
              onSelect={(label) => setA({ ...a, budget: BUDGETS.find((b) => b.label === label)?.value ?? "mostly_free" })}
            />
          )}

          {step === 6 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {FORMATS.map((f) => {
                const on = a.formats.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() =>
                      setA({
                        ...a,
                        formats: on ? a.formats.filter((x) => x !== f) : [...a.formats.filter((x) => x !== "Mixed" || f === "Mixed"), f],
                      })
                    }
                    className={cn(
                      "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                      on ? "border-primary bg-primary/10 text-foreground" : "border-border bg-surface text-muted-foreground hover:border-border-strong",
                    )}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? navigate({ to: "/dashboard" }) : setStep(step - 1))}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step === steps.length - 1 ? (
            <Button size="lg" disabled={!current.valid} onClick={build}>
              Build my path <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button size="lg" disabled={!current.valid} onClick={() => setStep(step + 1)}>
              Continue <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Choices({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onSelect(o)}
          className={cn(
            "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
            value === o
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-surface text-muted-foreground hover:border-border-strong",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
