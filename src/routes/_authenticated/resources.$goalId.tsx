import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listResources, markResourceDone } from "@/lib/fathom.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/resources/$goalId")({
  head: () => ({
    meta: [
      { title: "Curated resources — Fathom" },
      { name: "description", content: "Every resource is scored on relevance, quality and time efficiency — and checked." },
      { property: "og:title", content: "Curated resources — Fathom" },
      { property: "og:description", content: "Ranked, verified learning materials with the reasoning behind each pick." },
    ],
  }),
  component: Resources,
});

const FILTERS = ["all", "video", "article", "course", "docs", "interactive", "book"] as const;

function Resources() {
  const { goalId } = Route.useParams();
  const load = useServerFn(listResources);
  const markDone = useServerFn(markResourceDone);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const { data, isLoading } = useQuery({ queryKey: ["resources", goalId], queryFn: () => load({ data: { goalId } }) });

  if (isLoading || !data) {
    return (
      <AppShell title="Resources" goalId={goalId}>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const moduleById = new Map(data.modules.map((m) => [m.id, m]));
  const items = data.items.filter((i) => filter === "all" || i.resources?.resource_type === filter);

  return (
    <AppShell title="Resources" goalId={goalId}>
      <div className="space-y-7">
        <div>
          <h2 className="display text-3xl">Curated resources</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Each candidate was scored on relevance to your goal, teaching quality, time efficiency and recency. Only the
            links that survived verification are here — and every pick shows why it beat the alternatives.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                filter === f
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border-strong text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div>
            <p className="text-sm text-muted-foreground">
              {research.isPending
                ? "Searching the web for free videos, documentation and courses, then verifying every link…"
                : "No resources of this type yet. Resources are researched module by module as you advance, so they stay current."}
            </p>
            <Button className="mt-4" onClick={() => research.mutate()} disabled={research.isPending}>
              {research.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {research.isPending ? "Researching…" : "Find resources now"}
            </Button>
          </div>

        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {items.map((item) => {
              const r = item.resources;
              const mod = moduleById.get(item.module_id);
              return (
                <article key={item.id} className="panel flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={r?.url ?? "#"}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-medium hover:text-primary"
                    >
                      {r?.title}
                      <ExternalLink className="ml-1.5 inline size-3.5 text-muted-foreground" />
                    </a>
                    <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                      {r?.resource_type}
                    </Badge>
                  </div>

                  <p className="num mt-2 text-xs text-muted-foreground">
                    {r?.provider} · {r?.duration_minutes ? `${r.duration_minutes} min` : "self-paced"} · {r?.price}
                    {r?.difficulty ? ` · ${r.difficulty}` : ""}
                  </p>

                  {r?.description ? <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{r.description}</p> : null}

                  <div className="mt-4 grid grid-cols-3 gap-3 border-y border-border py-3">
                    <Score label="Relevance" value={Number(r?.relevance_score ?? 0)} />
                    <Score label="Quality" value={Number(r?.quality_score ?? 0)} />
                    <Score label="Hands-on" value={Number(r?.hands_on_score ?? 0)} />
                  </div>

                  {item.reason ? (
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      <span className="text-foreground">Why this one: </span>
                      {item.reason}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-3 pt-1">
                    <span className="num text-[11px] text-muted-foreground">
                      {mod ? `Week ${mod.week_number} · ${mod.title}` : ""}
                    </span>
                    <Button
                      size="sm"
                      variant={item.completed ? "secondary" : "outline"}
                      onClick={() =>
                        markDone({ data: { moduleResourceId: item.id, completed: !item.completed } }).then(() =>
                          qc.invalidateQueries({ queryKey: ["resources", goalId] }),
                        )
                      }
                    >
                      <CheckCircle2 className="size-3.5" />
                      {item.completed ? "Completed" : "Mark done"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="num text-sm">{Math.round(value * 100)}</div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
    </div>
  );
}
