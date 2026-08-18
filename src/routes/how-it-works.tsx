import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Fathom works — from goal to mastery" },
      {
        name: "description",
        content:
          "Fathom decomposes your goal into skills, researches and ranks real resources, builds a minimum effective roadmap, then adapts it to your measured mastery.",
      },
      { property: "og:title", content: "How Fathom works — from goal to mastery" },
      {
        property: "og:description",
        content: "Skill decomposition, resource research and ranking, adaptive roadmaps and mastery tracking.",
      },
    ],
  }),
  component: HowItWorks,
});

const STAGES = [
  {
    stage: "Goal analysis",
    body: "You describe the outcome in plain language — “I want to publish my own mobile apps”. Fathom interprets the outcome, your level, budget, deadline and real daily time.",
  },
  {
    stage: "Skill decomposition",
    body: "The goal becomes a tree: skills, subskills, prerequisites and concrete concepts. Everything is classified essential, recommended, optional or advanced.",
  },
  {
    stage: "Minimum effective path",
    body: "Only what's required for your stated outcome enters the default path. Optional and advanced material stays available but out of your way.",
  },
  {
    stage: "Resource research",
    body: "Modular providers search official documentation, video, courses, practice platforms and long-form writing. Every link is verified to resolve before it's stored — nothing fabricated.",
  },
  {
    stage: "Resource ranking",
    body: "Candidates are scored on relevance, authority, clarity, difficulty fit, time efficiency, practical value, freshness, cost and redundancy — never popularity. You get the smallest set that covers the concept, with the reasoning shown.",
  },
  {
    stage: "Roadmap and daily plan",
    body: "Modules are sequenced into weeks that fit your capacity, then each day becomes a session that never exceeds the time you said you have.",
  },
  {
    stage: "Practice and feedback",
    body: "Every session ends in an assessment matched to the subject — code tasks, edit decisions, scenario problems, explain-in-your-own-words — with specific, actionable critique.",
  },
  {
    stage: "Mastery and adaptation",
    body: "Exposure, recall, application and confidence are tracked per concept. Strong concepts get skipped; weak ones get prerequisites, alternative resources and extra practice.",
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <Link to="/" className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <h1 className="display text-4xl sm:text-5xl">How Fathom works</h1>
        <p className="mt-4 text-muted-foreground">
          Eight stages, one connected system. Your notes, progress, mastery, resources and projects all reference the
          same source of truth.
        </p>

        <ol className="mt-12 space-y-px overflow-hidden rounded-xl border border-border bg-border">
          {STAGES.map((s, i) => (
            <li key={s.stage} className="bg-card p-6">
              <div className="num mb-2 text-xs text-primary">{String(i + 1).padStart(2, "0")}</div>
              <h2 className="text-base font-medium">{s.stage}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>

        <Button asChild size="lg" className="mt-12">
          <Link to="/login">
            Start learning <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
