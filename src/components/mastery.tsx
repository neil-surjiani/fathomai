import { cn } from "@/lib/utils";

export function MasteryBar({
  value,
  className,
  segments = 10,
}: {
  value: number;
  className?: string;
  segments?: number;
}) {
  const pct = Math.max(0, Math.min(1, value));
  const filled = Math.round(pct * segments);
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex gap-[3px]">
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-3 rounded-[1px] transition-colors",
              i < filled ? "bg-primary" : "bg-border-strong",
            )}
          />
        ))}
      </div>
      <span className="num text-xs text-muted-foreground">{Math.round(pct * 100)}%</span>
    </div>
  );
}

export function Meter({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="num text-foreground">{pct}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-border-strong">
        <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="num text-2xl text-foreground">{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function importanceTone(importance: string) {
  switch (importance) {
    case "essential":
      return "border-primary/40 bg-primary/10 text-primary";
    case "recommended":
      return "border-success/40 bg-success/10 text-success";
    case "optional":
      return "border-border-strong bg-secondary text-muted-foreground";
    default:
      return "border-accent/40 bg-accent/10 text-accent";
  }
}
