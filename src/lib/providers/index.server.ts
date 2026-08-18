/**
 * Modular resource discovery layer.
 *
 * Each provider knows how to propose candidate resources for a concept and
 * normalizes them into a single shape. Candidates are then *verified* (the URL
 * must actually resolve) before anything is stored, so the app never shows
 * fabricated resources.
 */

import { chatJson, MODELS } from "../ai/gateway.server";

export type ResourceCandidate = {
  title: string;
  url: string;
  provider: string;
  resource_type:
    | "video"
    | "documentation"
    | "course"
    | "article"
    | "book"
    | "repository"
    | "interactive"
    | "practice"
    | "podcast";
  author?: string | null;
  duration_minutes?: number | null;
  price?: "free" | "paid" | "freemium";
  difficulty?: "beginner" | "intermediate" | "advanced";
  description?: string | null;
  topics?: string[];
  source: string;
};

export type DiscoveryContext = {
  goalTitle: string;
  concept: string;
  concepts: string[];
  level: string;
  budget: string;
  formats: string[];
};

export interface ResourceProvider {
  name: string;
  discover(ctx: DiscoveryContext): Promise<ResourceCandidate[]>;
}

type RawCandidate = Partial<ResourceCandidate> & { url?: string; title?: string };

/**
 * Provider-shaped candidate generation. The model is instructed to only emit
 * canonical, well-known, stable URLs — everything it returns is then verified
 * over the network, and unreachable links are discarded.
 */
async function proposeCandidates(
  ctx: DiscoveryContext,
  domainInstruction: string,
  source: string,
  types: string,
): Promise<ResourceCandidate[]> {
  const data = await chatJson<{ resources?: RawCandidate[] }>(
    [
      {
        role: "system",
        content: [
          "You are a research engine that locates real, existing, publicly accessible learning resources.",
          "Only return resources you are confident exist at a stable canonical URL (official docs, well-known channels, canonical course pages, canonical repository URLs).",
          "Never invent URLs, IDs, slugs, view counts, ratings or reviews. If unsure about a specific page, return the canonical landing page instead.",
          "Prefer resources that are currently maintained.",
          domainInstruction,
        ].join(" "),
      },
      {
        role: "user",
        content: `Goal: ${ctx.goalTitle}
Concept to cover: ${ctx.concept}
Sub-concepts: ${ctx.concepts.join(", ") || "n/a"}
Learner level: ${ctx.level}
Budget: ${ctx.budget}
Preferred formats: ${ctx.formats.join(", ") || "mixed"}

Return JSON: {"resources":[{"title","url","provider","resource_type" (one of ${types}),"author","duration_minutes" (integer estimate or null),"price" ("free"|"paid"|"freemium"),"difficulty" ("beginner"|"intermediate"|"advanced"),"description" (one sentence, factual),"topics" (array of short strings)}]}
Return between 2 and 5 resources. Fewer is better than uncertain ones.`,
      },
    ],
    { model: MODELS.reasoning, temperature: 0.3 },
  );

  return (data.resources ?? [])
    .filter((r): r is RawCandidate & { url: string; title: string } => Boolean(r?.url && r?.title))
    .map((r) => ({
      title: r.title.slice(0, 300),
      url: r.url.trim(),
      provider: r.provider ?? new URL(safeUrl(r.url)).hostname.replace(/^www\./, ""),
      resource_type: (r.resource_type ?? "article") as ResourceCandidate["resource_type"],
      author: r.author ?? null,
      duration_minutes: typeof r.duration_minutes === "number" ? r.duration_minutes : null,
      price: r.price ?? "free",
      difficulty: r.difficulty ?? "beginner",
      description: r.description ?? null,
      topics: Array.isArray(r.topics) ? r.topics.slice(0, 8) : [],
      source,
    }));
}

function safeUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    return "https://example.com";
  }
}

export const YouTubeProvider: ResourceProvider = {
  name: "youtube",
  discover: (ctx) =>
    proposeCandidates(
      ctx,
      "Focus on well-established YouTube channels and playlists known for this subject. Use canonical channel or playlist URLs rather than guessed video IDs.",
      "youtube",
      '"video"',
    ),
};

export const DocumentationProvider: ResourceProvider = {
  name: "documentation",
  discover: (ctx) =>
    proposeCandidates(
      ctx,
      "Focus on official documentation, official guides and specification pages from the technology or field's own website.",
      "documentation",
      '"documentation","article"',
    ),
};

export const CourseProvider: ResourceProvider = {
  name: "courses",
  discover: (ctx) =>
    proposeCandidates(
      ctx,
      "Focus on structured courses from reputable platforms and universities. Include both free and paid where the budget allows.",
      "courses",
      '"course","interactive"',
    ),
};

export const WebSearchProvider: ResourceProvider = {
  name: "web",
  discover: (ctx) =>
    proposeCandidates(
      ctx,
      "Focus on high-signal long-form articles, reference guides, and books from authoritative publications or authors in the field.",
      "web",
      '"article","book","podcast"',
    ),
};

export const PracticeProvider: ResourceProvider = {
  name: "practice",
  discover: (ctx) =>
    proposeCandidates(
      ctx,
      "Focus on hands-on practice: exercise platforms, interactive playgrounds, challenge sites, and canonical GitHub repositories of examples or exercises.",
      "practice",
      '"practice","interactive","repository"',
    ),
};

export const providers: ResourceProvider[] = [
  DocumentationProvider,
  YouTubeProvider,
  CourseProvider,
  PracticeProvider,
  WebSearchProvider,
];

/** Verifies a URL resolves. Unreachable candidates are dropped. */
export async function verifyUrl(url: string): Promise<boolean> {
  const attempt = async (method: "HEAD" | "GET") => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; FathomBot/1.0)" },
      });
      return res.status < 400 || res.status === 405 || res.status === 403 || res.status === 429;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };
  if (!/^https?:\/\//i.test(url)) return false;
  return (await attempt("HEAD")) || (await attempt("GET"));
}

export async function discoverResources(ctx: DiscoveryContext): Promise<ResourceCandidate[]> {
  const wanted = selectProviders(ctx);
  const settled = await Promise.allSettled(wanted.map((p) => p.discover(ctx)));
  const all = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));

  // De-duplicate by normalized URL
  const seen = new Set<string>();
  const unique = all.filter((r) => {
    const key = r.url.replace(/\/+$/, "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const budgetFiltered = unique.filter((r) =>
    ctx.budget === "free_only" ? r.price !== "paid" : true,
  );

  const verified = await Promise.all(
    budgetFiltered.map(async (r) => ((await verifyUrl(r.url)) ? r : null)),
  );
  return verified.filter((r): r is ResourceCandidate => r !== null);
}

function selectProviders(ctx: DiscoveryContext): ResourceProvider[] {
  const formats = ctx.formats.map((f) => f.toLowerCase());
  if (formats.length === 0 || formats.includes("mixed")) return providers;
  const picked = new Set<ResourceProvider>([DocumentationProvider, WebSearchProvider]);
  if (formats.includes("video")) picked.add(YouTubeProvider);
  if (formats.includes("projects") || formats.includes("exercises") || formats.includes("interactive practice"))
    picked.add(PracticeProvider);
  if (formats.includes("reading")) picked.add(WebSearchProvider);
  picked.add(CourseProvider);
  return [...picked];
}
