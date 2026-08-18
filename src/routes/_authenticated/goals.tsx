import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MasteryBar } from "@/components/mastery";
import { deleteGoal, exportData, getDashboard } from "@/lib/fathom.functions";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Your goals — Fathom" },
      { name: "description", content: "Manage your learning goals, export your data, or start something new." },
      { property: "og:title", content: "Your goals — Fathom" },
      { property: "og:description", content: "Switch goals, pause them, export everything you've built." },
    ],
  }),
  component: Goals,
});

function Goals() {
  const load = useServerFn(getDashboard);
  const remove = useServerFn(deleteGoal);
  const doExport = useServerFn(exportData);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => load({ data: {} }) });

  const download = async () => {
    const payload = await doExport({});
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fathom-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Goals"
      goalId={data?.goal?.id ?? null}
      actions={
        <Button asChild size="sm">
          <Link to="/onboarding">
            <Plus className="size-3.5" /> New goal
          </Link>
        </Button>
      }
    >
      <div className="space-y-7">
        <div>
          <h2 className="display text-3xl">Your goals</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Learn several things at once, or park a goal and come back. Your notes, mastery and history stay yours.
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {(data?.goals ?? []).map((g) => (
              <div key={g.id} className="panel flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{g.title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {g.status}
                    </Badge>
                  </div>
                  <p className="num mt-1 text-xs text-muted-foreground">
                    {g.estimated_total_hours} h · {g.minutes_per_day} min × {g.days_per_week} days/week
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <MasteryBar value={Number(g.mastery_score)} />
                  <Button asChild size="sm" variant="outline">
                    <Link to="/roadmap/$goalId" params={{ goalId: g.id }}>
                      Open
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      remove({ data: { goalId: g.id } }).then(() => {
                        toast.success("Goal deleted.");
                        qc.invalidateQueries({ queryKey: ["dashboard"] });
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {(data?.goals ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No goals yet.{" "}
                <button type="button" className="text-primary hover:underline" onClick={() => navigate({ to: "/onboarding" })}>
                  Create your first one.
                </button>
              </p>
            ) : null}
          </div>
        )}

        <section className="panel p-6">
          <h3 className="text-sm font-medium">Your data</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything Fathom builds for you is exportable — goals, roadmaps, notes, mastery and session history.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={download}>
            Export as JSON
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
