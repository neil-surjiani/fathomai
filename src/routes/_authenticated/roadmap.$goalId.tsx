import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { MasteryBar, Stat, importanceTone } from "@/components/mastery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adaptPath, getGoalDetail } from "@/lib/fathom.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/roadmap/$goalId")({
  head: () => ({
    meta: [
      { title: "Your learning path — Fathom" },
      { name: "description", content: "Your sequenced roadmap: modules, concepts, resources and mastery." },
      { property: "og:title", content: "Your learning path — Fathom" },
      { property: "og:description", content: "Weekly modules built from the minimum effective path for your goal." },
    ],
  }),
  component: Roadmap,
});

function Roadmap() {
  const { goalId } = Route.useParams();
  const load = useServerFn(getGoalDetail);
  const adapt = useServerFn(adaptPath);
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["goal", goalId],
    queryFn: () => load({ data: { goalId } }),
  });

  const adaptation = useMutation({
    mutationFn: () => adapt({ data: { goalId } }),
    onSuccess: (result) => {
      toast.success(result.summary ?? "Roadmap recalculated.");
      qc.invalidateQueries({ queryKey: ["goal", goalId] });
    },
    onError: () => toast.error("Could not recalculate the roadmap."),
  });

  if (isLoading || !data?.goal) {
    return (
      <AppShell title="Roadmap" goalId={goalId}>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const goal = data.goal;
  const weeks = [...new Set(data.modules.map((m) => m.week_number))].sort((x, y) => x - y);
  const resourcesByModule = new Map<string, typeof data.moduleResources>();
  for (const mr of data.moduleResources) {
    const list = resourcesByModule.get(mr.module_id) ?? [];
    list.push(mr);
    resourcesByModule.set(mr.module_id, list);
  }
  const masteryByConcept = new Map(data.mastery.map((m) => [m.concept, Number(m.mastery)]));

  return (
    <AppShell
      title="Roadmap"
      goalId={goalId}
      actions={
        <Button variant="outline" size="sm" onClick={() => adaptation.mutate()} disabled={adaptation.isPending}>
          {adaptation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Adapt path
        </Button>
      }
    >
      <div className="space-y-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your learning path</p>
          <h2 className="display mt-1 text-3xl sm:text-4xl">{goal.title}</h2>
        </div>

        <div className="grid gap-6 rounded-xl border border-border bg-card p-6 sm:grid-cols-3">
          <Stat label="Estimated total" value={`${goal.estimated_total_hours} hours`} />
          <Stat
            label="At your pace"
            value={
              goal.estimated_completion_date
                ? `${Math.max(
                    1,
                    Math.ceil((new Date(goal.estimated_completion_date).getTime() - Date.now()) / 86400000),
                  )} days`
                : "—"
            }
            hint={`${goal.minutes_per_day} min × ${goal.days_per_week} days/week`}
          />
          <Stat label="Current mastery" value={`${Math.round(Number(goal.mastery_score) * 100)}%`} />
        </div>

        <div className="space-y-10">
          {weeks.map((week) => (
            <section key={week}>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="num text-xs uppercase tracking-[0.14em] text-muted-foreground">Week {week}</h3>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2.5">
                {data.modules
                  .filter((m) => m.week_number === week)
                  .map((m) => {
                    const isOpen = open === m.id;
                    const resources = resourcesByModule.get(m.id) ?? [];
                    return (
                      <div key={m.id} className="overflow-hidden rounded-xl border border-border bg-card">
                        <button
                          type="button"
                          onClick={() => setOpen(isOpen ? null : m.id)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">{m.title}</span>
                              <Badge variant="outline" className={cn("text-[10px] capitalize", importanceTone(m.importance))}>
                                {m.importance}
                              </Badge>
                              {m.status !== "not_started" ? (
                                <span className="num text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {m.status.replace("_", " ")}
                                </span>
                              ) : null}
                            </div>
                            <p className="num mt-1 text-xs text-muted-foreground">
                              {m.estimated_minutes} min · {m.concepts.length} concepts
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <MasteryBar value={Number(m.mastery)} />
                            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                          </div>
                        </button>

                        {isOpen ? (
                          <div className="space-y-5 border-t border-border px-5 py-5">
                            {m.objective ? <p className="text-sm text-muted-foreground">{m.objective}</p> : null}

                            <div>
                              <h4 className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Concepts</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {m.concepts.map((c) => (
                                  <span
                                    key={c}
                                    className="num rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted-foreground"
                                  >
                                    {c}
                                    <span className="ml-1.5 text-primary">
                                      {Math.round((masteryByConcept.get(c) ?? 0) * 100)}%
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                Selected resources
                              </h4>
                              {resources.length ? (
                                <ul className="space-y-2.5">
                                  {resources.map((r) => (
                                    <li key={r.id} className="rounded-lg border border-border bg-surface p-3.5">
                                      <a
                                        href={r.resources?.url ?? "#"}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="flex items-start justify-between gap-3 text-sm hover:text-primary"
                                      >
                                        <span>{r.resources?.title}</span>
                                        <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                      </a>
                                      <p className="num mt-1 text-xs text-muted-foreground">
                                        {r.resources?.provider} · {r.resources?.resource_type} ·{" "}
                                        {r.resources?.duration_minutes ? `${r.resources.duration_minutes} min` : "self-paced"} ·{" "}
                                        {r.resources?.price}
                                      </p>
                                      {r.reason ? (
                                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                          <span className="text-foreground">Why this one: </span>
                                          {r.reason}
                                        </p>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Resources for this module are researched when you reach it, so they're current when you
                                  need them.
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button asChild size="sm">
                                <Link to="/session/$goalId" params={{ goalId }}>
                                  Start a session
                                </Link>
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                <Link to="/resources/$goalId" params={{ goalId }}>
                                  Inspect resources
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>

        {data.skills.length ? (
          <section className="panel p-6">
            <h3 className="text-sm font-medium">Skill decomposition</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Optional and advanced branches stay here until you choose to expand them.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {data.skills
                .filter((s) => !s.parent_id)
                .map((parent) => (
                  <div key={parent.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{parent.name}</span>
                      <Badge variant="outline" className={cn("text-[10px] capitalize", importanceTone(parent.importance))}>
                        {parent.importance}
                      </Badge>
                    </div>
                    <ul className="mt-2 space-y-1 border-l border-border pl-3">
                      {data.skills
                        .filter((s) => s.parent_id === parent.id)
                        .map((child) => (
                          <li key={child.id} className="text-xs text-muted-foreground">
                            {child.name}
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
