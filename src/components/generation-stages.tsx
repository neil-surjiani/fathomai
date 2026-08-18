import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type StageState = "pending" | "running" | "done" | "failed";
export type Stage = { key: string; label: string; state: StageState; note?: string | undefined };

export function GenerationStages({ stages, title }: { stages: Stage[]; title: string }) {
  return (
    <div className="panel mx-auto w-full max-w-md p-7">
      <h2 className="display text-xl">{title}</h2>
      <ul className="mt-6 space-y-3">
        {stages.map((s) => (
          <li key={s.key} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
              {s.state === "done" ? (
                <Check className="size-4 text-success" />
              ) : s.state === "running" ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : s.state === "failed" ? (
                <span className="size-1.5 rounded-full bg-destructive" />
              ) : (
                <span className="size-1.5 rounded-full bg-border-strong" />
              )}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  s.state === "pending" && "text-muted-foreground",
                  s.state === "running" && "text-foreground",
                  s.state === "done" && "text-muted-foreground",
                  s.state === "failed" && "text-destructive",
                )}
              >
                {s.label}
              </span>
              {s.note ? <span className="block text-xs text-muted-foreground">{s.note}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Each step runs for real — skills are mapped, resources are searched and every link is checked before it enters
        your path.
      </p>
    </div>
  );
}
