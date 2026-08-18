import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listNotes, makeNotes, saveUserNote } from "@/lib/fathom.functions";

export const Route = createFileRoute("/_authenticated/knowledge/$goalId")({
  head: () => ({
    meta: [
      { title: "Knowledge base — Fathom" },
      { name: "description", content: "Your personal, searchable knowledge base built automatically as you learn." },
      { property: "og:title", content: "Knowledge base — Fathom" },
      { property: "og:description", content: "Explanations, key points, examples and the mistakes to avoid." },
    ],
  }),
  component: Knowledge,
});

function Knowledge() {
  const { goalId } = Route.useParams();
  const load = useServerFn(listNotes);
  const generate = useServerFn(makeNotes);
  const save = useServerFn(saveUserNote);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data: notes, isLoading } = useQuery({ queryKey: ["notes", goalId], queryFn: () => load({ data: { goalId } }) });

  const create = useMutation({
    mutationFn: () => generate({ data: { goalId, concepts: [topic.trim()] } }),
    onSuccess: () => {
      setTopic("");
      toast.success("Added to your knowledge base.");
      qc.invalidateQueries({ queryKey: ["notes", goalId] });
    },
    onError: () => toast.error("Could not write that note."),
  });

  const filtered = (notes ?? []).filter((n) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      n.concept.toLowerCase().includes(needle) ||
      (n.explanation ?? "").toLowerCase().includes(needle) ||
      (n.key_points ?? []).some((k: string) => k.toLowerCase().includes(needle))
    );
  });

  return (
    <AppShell title="Knowledge base" goalId={goalId}>
      <div className="space-y-7">
        <div>
          <h2 className="display text-3xl">Your knowledge base</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Written for you as you learn — in plain language, tied to your goal. Search it, add your own notes, or ask
            for an explanation of anything that's still fuzzy.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search your notes" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Explain a concept…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="sm:w-64"
            />
            <Button onClick={() => create.mutate()} disabled={!topic.trim() || create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Write it
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing here yet. Finish a session, or ask for an explanation above and it lands in your knowledge base.
          </p>
        ) : (
          <div className="space-y-4">
            {filtered.map((n) => (
              <article key={n.id} className="panel p-6">
                <h3 className="display text-xl">{n.concept}</h3>
                {n.explanation ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{n.explanation}</p>
                ) : null}

                {n.key_points?.length ? (
                  <div className="mt-5">
                    <h4 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Key points</h4>
                    <ul className="mt-2 space-y-1.5">
                      {n.key_points.map((k: string, i: number) => (
                        <li key={i} className="flex gap-2.5 text-sm">
                          <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                          {k}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {n.examples?.length ? (
                  <div className="mt-5">
                    <h4 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Examples</h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      {n.examples.map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {n.common_mistakes?.length ? (
                  <div className="mt-5">
                    <h4 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Common mistakes</h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      {n.common_mistakes.map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {n.related_concepts?.length ? (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {n.related_concepts.map((c: string) => (
                      <span key={c} className="num rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 border-t border-border pt-4">
                  <h4 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Your notes</h4>
                  <Textarea
                    rows={3}
                    className="mt-2 resize-none"
                    placeholder="Add your own words — that's what makes it stick."
                    value={drafts[n.id] ?? n.user_notes ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [n.id]: e.target.value })}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      save({ data: { noteId: n.id, userNotes: drafts[n.id] ?? n.user_notes ?? "" } }).then(() => {
                        toast.success("Saved.");
                        qc.invalidateQueries({ queryKey: ["notes", goalId] });
                      })
                    }
                  >
                    Save
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
