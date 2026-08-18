import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({
    meta: [
      { title: "Explore learning paths — Fathom" },
      { name: "description", content: "Popular starting points, from app development to music production." },
      { property: "og:title", content: "Explore learning paths — Fathom" },
      { property: "og:description", content: "Pick a direction and Fathom builds the path around your time and level." },
    ],
  }),
  component: Explore,
});

const IDEAS = [
  { title: "App development", blurb: "Ship a real mobile app end to end, from UI to store release." },
  { title: "Film editing", blurb: "Cut, pace and colour a short film that people watch to the end." },
  { title: "Music production", blurb: "Write, arrange and mix a finished track in your DAW." },
  { title: "Machine learning", blurb: "Understand the maths, then train and evaluate real models." },
  { title: "Public speaking", blurb: "Structure a talk and deliver it without notes." },
  { title: "Data analysis", blurb: "Go from raw spreadsheets to decisions people trust." },
  { title: "3D modelling", blurb: "Model, texture and render an object that looks intentional." },
  { title: "Spanish conversation", blurb: "Hold a real 10-minute conversation without freezing." },
];

function Explore() {
  const navigate = useNavigate();
  return (
    <AppShell title="Explore">
      <div className="space-y-7">
        <div>
          <h2 className="display text-3xl">Explore</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Fathom works for anything — technical or creative, academic or practical. These are just common starting
            points; the path is always built around your goal, level and time.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IDEAS.map((i) => (
            <button
              key={i.title}
              type="button"
              onClick={() => navigate({ to: "/onboarding" })}
              className="panel group p-5 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{i.title}</span>
                <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{i.blurb}</p>
            </button>
          ))}
        </div>

        <Button size="lg" onClick={() => navigate({ to: "/onboarding" })}>
          Describe your own goal <ArrowRight className="size-4" />
        </Button>
      </div>
    </AppShell>
  );
}
