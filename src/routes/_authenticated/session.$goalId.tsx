import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, NotebookPen, Pause, Play } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { finishSession, getTodaySession, makeNotes, markResourceDone, startAssessment, submitAnswers } from "@/lib/fathom.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/session/$goalId")({
  head: () => ({
    meta: [
      { title: "Today's session — Fathom" },
      { name: "description", content: "A focused session sized to the time you actually have today." },
      { property: "og:title", content: "Today's session — Fathom" },
      { property: "og:description", content: "Learn, practise, get checked and capture notes in one flow." },
    ],
  }),
  component: Session,
});

type Question = {
  id: string;
  prompt: string;
  question_type: string;
  options: string[] | null;
  concept: string | null;
};

function Session() {
  const { goalId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const load = useServerFn(getTodaySession);
  const finish = useServerFn(finishSession);
  const begin = useServerFn(startAssessment);
  const submit = useServerFn(submitAnswers);
  const notes = useServerFn(makeNotes);
  const markDone = useServerFn(markResourceDone);

  const { data, isLoading } = useQuery({ queryKey: ["session", goalId], queryFn: () => load({ data: { goalId } }) });

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [confidence, setConfidence] = useState(3);
  const [reflection, setReflection] = useState("");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Array<{ concept: string | null; score: number; feedback: string }> | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const started = useRef(Date.now());

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const startCheck = useMutation({
    mutationFn: () =>
      begin({ data: { goalId, moduleId: data?.session.module_id ?? null, sessionId: data?.session.id ?? null } }),
    onSuccess: (res: { assessment?: { id: string }; questions?: Question[] }) => {
      setAssessmentId(res.assessment?.id ?? null);
      setQuestions((res.questions ?? []) as Question[]);
    },
    onError: () => toast.error("Could not generate the check-in questions."),
  });

  const grade = useMutation({
    mutationFn: () =>
      submit({
        data: {
          assessmentId: assessmentId!,
          responses: Object.entries(answers).map(([questionId, response]) => ({ questionId, response })),
        },
      }),
    onSuccess: (res: { score?: number; results?: Array<{ concept: string | null; score: number; feedback: string }> }) => {
      setScore(res.score ?? 0);
      setResults(res.results ?? []);
    },
    onError: () => toast.error("Could not grade your answers."),
  });

  const writeNotes = useMutation({
    mutationFn: () => notes({ data: { goalId, concepts: (data?.module?.concepts ?? []).slice(0, 4), material: reflection } }),
    onSuccess: () => toast.success("Notes added to your knowledge base."),
    onError: () => toast.error("Could not generate notes."),
  });

  const complete = useMutation({
    mutationFn: () =>
      finish({
        data: {
          sessionId: data!.session.id,
          goalId,
          minutes: Math.max(1, Math.round((Date.now() - started.current) / 60000)),
          confidence,
          notes: reflection,
          concepts: data?.module?.concepts ?? [],
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Session logged. Your path adapts from here.");
      navigate({ to: "/dashboard" });
    },
    onError: () => toast.error("Could not save the session."),
  });

  if (isLoading || !data) {
    return (
      <AppShell title="Session" goalId={goalId}>
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <p className="text-sm">Planning today's session around your time and mastery…</p>
        </div>
      </AppShell>
    );
  }

  const session = data.session;
  const plan = (session.plan ?? []) as Array<{ minutes: number; title: string; kind: string; detail?: string }>;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <AppShell
      title="Today's session"
      goalId={goalId}
      actions={
        <div className="flex items-center gap-2">
          <span className="num text-lg tabular-nums">{mm}:{ss}</span>
          <Button variant="outline" size="sm" onClick={() => setRunning(!running)}>
            {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {running ? "Pause" : "Resume"}
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {new Date(session.session_date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            {" · "}
            {session.planned_minutes} min planned
          </p>
          <h2 className="display mt-1 text-3xl">{data.module?.title ?? "Focused practice"}</h2>
          {session.objective ? <p className="mt-2 text-sm text-muted-foreground">{session.objective}</p> : null}
        </div>

        <section className="panel p-6">
          <h3 className="text-sm font-medium">Plan</h3>
          <ul className="mt-4 space-y-3">
            {plan.map((item, i) => (
              <li key={i} className="flex gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <span className="num w-14 shrink-0 text-xs text-primary">{item.minutes} min</span>
                <div className="min-w-0">
                  <p className="text-sm">{item.title}</p>
                  {item.detail ? <p className="text-xs text-muted-foreground">{item.detail}</p> : null}
                  <Badge variant="outline" className="mt-1.5 text-[10px] capitalize">
                    {item.kind}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {data.moduleResources.length ? (
          <section className="panel p-6">
            <h3 className="text-sm font-medium">Use these resources</h3>
            <ul className="mt-4 space-y-2.5">
              {data.moduleResources.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3.5">
                  <div className="min-w-0">
                    <a
                      href={r.resources?.url ?? "#"}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-1.5 text-sm hover:text-primary"
                    >
                      {r.resources?.title}
                      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                    </a>
                    <p className="num mt-1 text-xs text-muted-foreground">
                      {r.resources?.provider} ·{" "}
                      {r.resources?.duration_minutes ? `${r.resources.duration_minutes} min` : "self-paced"}
                    </p>
                  </div>
                  <Button
                    variant={r.completed ? "secondary" : "outline"}
                    size="sm"
                    onClick={() =>
                      markDone({ data: { moduleResourceId: r.id, completed: !r.completed } }).then(() =>
                        qc.invalidateQueries({ queryKey: ["session", goalId] }),
                      )
                    }
                  >
                    <CheckCircle2 className="size-3.5" />
                    {r.completed ? "Done" : "Mark done"}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="panel p-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium">Check what stuck</h3>
            {score !== null ? <span className="num text-sm text-primary">{Math.round(score * 100)}%</span> : null}
          </div>
          {!questions ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                A short check on today's concepts. Your answers move real mastery scores — guessing just makes the path
                harder later.
              </p>
              <Button className="mt-4" onClick={() => startCheck.mutate()} disabled={startCheck.isPending}>
                {startCheck.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Start the check
              </Button>
            </>
          ) : (
            <div className="mt-5 space-y-6">
              {questions.map((q, i) => {
                const result = results?.[i];
                return (
                  <div key={q.id}>
                    <p className="text-sm">
                      <span className="num mr-2 text-muted-foreground">{i + 1}.</span>
                      {q.prompt}
                    </p>
                    {q.options?.length ? (
                      <div className="mt-3 grid gap-2">
                        {q.options.map((o) => (
                          <button
                            key={o}
                            type="button"
                            disabled={Boolean(results)}
                            onClick={() => setAnswers({ ...answers, [q.id]: o })}
                            className={cn(
                              "rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                              answers[q.id] === o
                                ? "border-primary bg-primary/10"
                                : "border-border bg-surface text-muted-foreground hover:border-border-strong",
                            )}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Textarea
                        rows={3}
                        disabled={Boolean(results)}
                        className="mt-3 resize-none"
                        placeholder="Explain in your own words"
                        value={answers[q.id] ?? ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      />
                    )}
                    {result ? (
                      <p className="mt-2 rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground">
                        <span className="num text-primary">{Math.round(result.score * 100)}% </span>
                        {result.feedback}
                      </p>
                    ) : null}
                  </div>
                );
              })}
              {!results ? (
                <Button
                  onClick={() => grade.mutate()}
                  disabled={grade.isPending || Object.keys(answers).length === 0}
                >
                  {grade.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Submit answers
                </Button>
              ) : null}
            </div>
          )}
        </section>

        <section className="panel p-6">
          <h3 className="text-sm font-medium">Reflect and wrap up</h3>
          <Textarea
            rows={4}
            className="mt-4 resize-none"
            placeholder="What clicked? What's still fuzzy? Anything you want remembered."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />
          <div className="mt-6">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">How confident do you feel?</span>
              <span className="num text-lg">{confidence}/5</span>
            </div>
            <Slider value={[confidence]} min={1} max={5} step={1} onValueChange={([v]) => setConfidence(v ?? 3)} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="lg" onClick={() => complete.mutate()} disabled={complete.isPending}>
              {complete.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Finish session
            </Button>
            <Button variant="outline" size="lg" onClick={() => writeNotes.mutate()} disabled={writeNotes.isPending}>
              {writeNotes.isPending ? <Loader2 className="size-4 animate-spin" /> : <NotebookPen className="size-4" />}
              Save notes to knowledge base
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
