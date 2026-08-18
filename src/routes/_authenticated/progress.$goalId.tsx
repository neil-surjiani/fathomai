import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Meter, Stat } from "@/components/mastery";
import { getProgress } from "@/lib/fathom.functions";

export const Route = createFileRoute("/_authenticated/progress/$goalId")({
  head: () => ({
    meta: [
      { title: "Progress — Fathom" },
      { name: "description", content: "Mastery per concept, study consistency and assessment history." },
      { property: "og:title", content: "Progress — Fathom" },
      { property: "og:description", content: "Real signals of learning, not video-watching streaks." },
    ],
  }),
  component: Progress,
});

function Progress() {
  const { goalId } = Route.useParams();
  const load = useServerFn(getProgress);
  const { data, isLoading } = useQuery({ queryKey: ["progress", goalId], queryFn: () => load({ data: { goalId } }) });

  if (isLoading || !data?.goal) {
    return (
      <AppShell title="Progress" goalId={goalId}>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const done = data.sessions.filter((s) => s.status === "complete");
  const minutes = done.reduce((a, s) => a + (s.actual_minutes ?? 0), 0);
  const strong = data.mastery.filter((m) => Number(m.mastery) >= 0.7).length;
  const scored = data.assessments.filter((a) => a.score !== null);
  const avgScore = scored.length ? scored.reduce((a, b) => a + Number(b.score), 0) / scored.length : null;
  const maxMinutes = Math.max(30, ...data.sessions.map((s) => s.actual_minutes ?? 0));

  return (
    <AppShell title="Progress" goalId={goalId}>
      <div className="space-y-8">
        <div>
          <h2 className="display text-3xl">Progress</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Mastery here means you demonstrated it — recall, application and retention over time, not time spent.
          </p>
        </div>

        <div className="grid gap-6 rounded-xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total study time" value={`${Math.round(minutes / 60)} h`} hint={`${done.length} sessions`} />
          <Stat label="Concepts mastered" value={`${strong} / ${data.mastery.length}`} hint="At 70% mastery or above" />
          <Stat
            label="Assessment average"
            value={avgScore === null ? "—" : `${Math.round(avgScore * 100)}%`}
            hint={`${scored.length} checks graded`}
          />
          <Stat
            label="Projects"
            value={`${data.projects.filter((p) => p.status === "complete").length} / ${data.projects.length}`}
            hint="Applied practice"
          />
        </div>

        <section className="panel p-6">
          <h3 className="text-sm font-medium">Study consistency</h3>
          <div className="mt-5 flex h-32 items-end gap-1.5">
            {data.sessions.slice(-30).map((s, i) => (
              <div key={i} className="group relative flex-1">
                <div
                  className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                  style={{ height: `${Math.max(3, ((s.actual_minutes ?? 0) / maxMinutes) * 120)}px` }}
                />
              </div>
            ))}
            {data.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions logged yet.</p>
            ) : null}
          </div>
        </section>

        <section className="panel p-6">
          <h3 className="text-sm font-medium">Mastery by concept</h3>
          {data.mastery.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {data.mastery.map((m) => (
                <Meter key={m.id} label={m.concept} value={Number(m.mastery)} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nothing measured yet.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
