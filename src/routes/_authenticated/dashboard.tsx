import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, Loader2, Plus, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { MasteryBar, Meter, Stat } from "@/components/mastery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { bootstrapProfile, getDashboard } from "@/lib/fathom.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Fathom" },
      { name: "description", content: "Today's plan, mastery, weakest concepts and what to do next." },
      { property: "og:title", content: "Dashboard — Fathom" },
      { property: "og:description", content: "Your current goal, today's session and your mastery at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const bootstrap = useServerFn(bootstrapProfile);
  const load = useServerFn(getDashboard);

  useEffect(() => {
    bootstrap({}).catch(() => undefined);
  }, [bootstrap]);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => load({ data: {} }),
  });

  useEffect(() => {
    if (data && !data.goal) navigate({ to: "/onboarding" });
  }, [data, navigate]);

  if (isLoading || !data) {
    return (
      <AppShell title="Dashboard">
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const goal = data.goal;
  if (!goal) return null;

  const modules = data.modules ?? [];
  const nextModule = modules.find((m) => m.status !== "complete" && m.status !== "skipped") ?? null;
  const upcoming = modules.filter((m) => m.status === "not_started").slice(0, 3);
  const plan = (data.todaySession?.plan ?? []) as Array<{ minutes: number; title: string; kind: string }>;

  return (
    <AppShell
      title="Dashboard"
      goalId={goal.id}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/onboarding">
            <Plus className="size-3.5" /> New goal
          </Link>
        </Button>
      }
    >
      <div className="space-y-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Current goal</p>
          <h2 className="display mt-1 text-3xl sm:text-4xl">{goal.title}</h2>
          {goal.description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{goal.description}</p> : null}
        </div>

        <div className="grid gap-6 rounded-xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Today's learning"
            value={`${data.minutesToday ?? 0} / ${goal.minutes_per_day} min`}
            hint={data.todaySession?.status === "complete" ? "Session complete" : "Session pending"}
          />
          <Stat label="Overall mastery" value={`${Math.round(Number(goal.mastery_score) * 100)}%`} hint="Across all tracked concepts" />
          <Stat label="Current streak" value={`${data.streak ?? 0} days`} hint="Days with real study time" />
          <Stat
            label="Estimated completion"
            value={
              goal.estimated_completion_date
                ? new Date(goal.estimated_completion_date).toLocaleDateString(undefined, { month: "long", day: "numeric" })
                : "—"
            }
            hint={`${goal.estimated_total_hours} h total`}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="panel p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-medium">Today's plan</h3>
              <span className="num text-xs text-muted-foreground">{goal.minutes_per_day} min</span>
            </div>
            {plan.length ? (
              <>
                {data.todaySession?.objective ? (
                  <p className="mt-3 text-sm text-muted-foreground">{data.todaySession.objective}</p>
                ) : null}
                <ul className="mt-5 space-y-3">
                  {plan.map((item, i) => (
                    <li key={i} className="flex gap-4 border-b border-border/60 pb-3 last:border-0">
                      <span className="num w-14 shrink-0 text-xs text-primary">{item.minutes} min</span>
                      <div className="min-w-0">
                        <p className="text-sm">{item.title}</p>
                        <p className="text-xs capitalize text-muted-foreground">{item.kind}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Your plan for today is generated when you open the session — built from your available time, mastery
                and what's unfinished.
              </p>
            )}
            <Button asChild size="lg" className="mt-6 w-full">
              <Link to="/session/$goalId" params={{ goalId: goal.id }}>
                Continue learning <ArrowRight className="size-4" />
              </Link>
            </Button>
            {nextModule ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Next up: {nextModule.title} · week {nextModule.week_number}
              </p>
            ) : null}
          </section>

          <div className="space-y-6">
            <section className="panel p-6">
              <h3 className="text-sm font-medium">Weakest concepts</h3>
              {data.weakConcepts?.length ? (
                <div className="mt-4 space-y-4">
                  {data.weakConcepts.map((c) => (
                    <Meter key={c.concept} label={c.concept} value={Number(c.mastery)} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing measured yet. Finish a session and an assessment to see where you actually stand.
                </p>
              )}
            </section>

            <section className="panel p-6">
              <h3 className="text-sm font-medium">Upcoming milestones</h3>
              {upcoming.length ? (
                <ul className="mt-4 space-y-3">
                  {upcoming.map((m) => (
                    <li key={m.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm">{m.title}</p>
                        <p className="num text-xs text-muted-foreground">Week {m.week_number}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                        {m.importance}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No modules queued.</p>
              )}
            </section>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="panel p-6 lg:col-span-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-medium">Roadmap</h3>
              <Link to="/roadmap/$goalId" params={{ goalId: goal.id }} className="text-xs text-primary hover:underline">
                Open roadmap
              </Link>
            </div>
            <div className="mt-4 space-y-2.5">
              {modules.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="num text-[11px] text-muted-foreground">Week {m.week_number}</div>
                    <div className="truncate text-sm">{m.title}</div>
                  </div>
                  <MasteryBar value={Number(m.mastery)} />
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-medium">Recent notes</h3>
              <Link to="/knowledge/$goalId" params={{ goalId: goal.id }} className="text-xs text-primary hover:underline">
                All notes
              </Link>
            </div>
            {data.notes?.length ? (
              <ul className="mt-4 space-y-3">
                {data.notes.map((n) => (
                  <li key={n.id}>
                    <p className="text-sm">{n.concept}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.explanation}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Your knowledge base fills itself as you study. Nothing here yet.
              </p>
            )}
            {data.projects?.length ? (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="size-3.5 text-accent" /> Active projects
                </h4>
                <ul className="mt-3 space-y-2">
                  {data.projects.map((p) => (
                    <li key={p.id} className="text-xs text-muted-foreground">
                      {p.title} · {p.status}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
