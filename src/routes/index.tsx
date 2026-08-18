import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Compass, Layers, Sparkles, Target, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MasteryBar } from "@/components/mastery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fathom — Learn anything. Properly." },
      {
        name: "description",
        content:
          "Tell Fathom what you want to learn, how much time you have, and where you want to get. It builds the path, finds the right resources, and adapts as you learn.",
      },
      { property: "og:title", content: "Fathom — Learn anything. Properly." },
      {
        property: "og:description",
        content: "A personal learning strategist, curriculum designer, research engine and tutor in one.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { title: "Tell us what you want to learn", detail: "Plain language. “I want to build and publish my own mobile apps.”" },
  { title: "We map the skills you need", detail: "Your goal becomes skills, subskills, prerequisites and checkpoints." },
  { title: "We find and rank the best resources", detail: "Docs, videos, courses, exercises — scored, verified, de-duplicated." },
  { title: "We build your personal roadmap", detail: "Sequenced into weeks that fit the time you actually have." },
  { title: "Learn, practice and get feedback", detail: "Every session ends in real practice and specific critique." },
  { title: "Your path adapts as you improve", detail: "Mastery drives what comes next. Skip what you know." },
];

const GOALS = [
  "Learn app development",
  "Learn video editing",
  "Learn guitar",
  "Learn Python",
  "Learn photography",
  "Learn machine learning",
  "Learn public speaking",
  "Learn digital marketing",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Waves className="size-4 text-primary" strokeWidth={2.2} />
            <span className="display text-lg">Fathom</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/login">Start learning</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="grain relative overflow-hidden">
        <div className="rule-grid pointer-events-none absolute inset-0 opacity-[0.35]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 sm:pt-28">
          <div className="rise max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3 text-primary" /> Adaptive learning intelligence
            </p>
            <h1 className="display text-5xl leading-[1.02] sm:text-7xl">
              Learn anything.
              <br />
              <span className="italic text-primary">Properly.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Tell us what you want to learn, how much time you have, and where you want to get. We build the path,
              find the right resources, and adapt it as you learn.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/login">
                  Start learning <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3">
          {[
            { icon: Target, title: "Outcome over content", body: "The path is built backwards from what you want to be able to do — not from a catalogue." },
            { icon: Layers, title: "Minimum effective path", body: "Every concept is classified essential, recommended, optional or advanced. You only study what moves you." },
            { icon: Compass, title: "Mastery, not completion", body: "Understanding, recall and application are tracked per concept, and the roadmap answers to them." },
          ].map((v) => (
            <div key={v.title} className="space-y-3">
              <v.icon className="size-5 text-primary" strokeWidth={1.8} />
              <h3 className="text-base font-medium">{v.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="display text-3xl sm:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="bg-card p-6">
              <div className="num mb-3 text-xs text-primary">0{i + 1}</div>
              <h3 className="text-sm font-medium">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="display text-3xl sm:text-4xl">Example goals</h2>
        <div className="mt-8 flex flex-wrap gap-2.5">
          {GOALS.map((g) => (
            <Link
              key={g}
              to="/login"
              className="rounded-full border border-border-strong bg-surface px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {g}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-24 text-center">
          <h2 className="display mx-auto max-w-2xl text-4xl leading-[1.1] sm:text-6xl">
            Don't search. Don't guess. <span className="italic text-primary">Just learn.</span>
          </h2>
          <ul className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["No course hunting", "No redundant videos", "No fabricated progress", "No guesswork"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-success" /> {t}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-10">
            <Link to="/login">
              Start learning <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <Waves className="size-3.5 text-primary" /> Fathom
          </span>
          <span>Built for people who want capability, not certificates.</span>
        </div>
      </footer>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="rise panel mt-16 overflow-hidden p-0 shadow-[var(--shadow-lift)]">
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
        <span className="size-2 rounded-full bg-destructive/60" />
        <span className="size-2 rounded-full bg-warning/60" />
        <span className="size-2 rounded-full bg-success/60" />
        <span className="ml-3 text-xs text-muted-foreground">Your learning path — Learn Flutter app development</span>
      </div>
      <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-8">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Estimated total</div>
              <div className="num text-xl">47 hours</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">At your pace</div>
              <div className="num text-xl">39 days</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Current mastery</div>
              <div className="num text-xl text-primary">24%</div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { w: "Week 1", t: "Programming foundations", m: 0.8 },
              { w: "Week 2", t: "Flutter fundamentals", m: 0.4 },
              { w: "Week 3", t: "UI + navigation", m: 0 },
              { w: "Week 4", t: "State management", m: 0 },
            ].map((r) => (
              <div key={r.w} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3.5 py-3">
                <div className="min-w-0">
                  <div className="num text-[11px] text-muted-foreground">{r.w}</div>
                  <div className="truncate text-sm">{r.t}</div>
                </div>
                <MasteryBar value={r.m} />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Today — 45 minutes</div>
          {[
            { m: "15 min", t: "Review async concepts" },
            { m: "15 min", t: "Watch selected lesson" },
            { m: "10 min", t: "Complete practice" },
            { m: "5 min", t: "Explain it in your own words" },
          ].map((i) => (
            <div key={i.t} className="flex gap-3 border-b border-border/60 pb-2.5 last:border-0">
              <span className="num w-12 shrink-0 text-xs text-primary">{i.m}</span>
              <span className="text-sm text-muted-foreground">{i.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
