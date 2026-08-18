import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Waves } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { tutor } from "@/lib/fathom.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tutor/$goalId")({
  head: () => ({
    meta: [
      { title: "AI tutor — Fathom" },
      { name: "description", content: "Ask anything about what you're learning — answered in the context of your path." },
      { property: "og:title", content: "AI tutor — Fathom" },
      { property: "og:description", content: "A tutor that knows your goal, your level and what you've covered." },
    ],
  }),
  component: Tutor,
});

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "Explain this like I'm completely new to it",
  "Why does this matter for my goal?",
  "Give me a harder example",
  "I'm stuck — what am I misunderstanding?",
];

function Tutor() {
  const { goalId } = Route.useParams();
  const ask = useServerFn(tutor);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || pending) return;
    const history = messages.slice(-8);
    setMessages([...messages, { role: "user", content: q }]);
    setInput("");
    setPending(true);
    try {
      const res = await ask({ data: { goalId, question: q, history } });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      toast.error("The tutor couldn't answer that. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AppShell title="AI tutor" goalId={goalId}>
      <div className="mx-auto flex max-w-2xl flex-col">
        {messages.length === 0 ? (
          <div className="py-10 text-center">
            <Waves className="mx-auto size-6 text-primary" strokeWidth={2.2} />
            <h2 className="display mt-4 text-3xl">Ask anything</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Your tutor knows your goal, your level, the concepts you've covered and where your mastery is weakest — so
              answers land at the right depth.
            </p>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-primary/12 text-foreground"
                    : "mr-auto border border-border bg-card text-muted-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {pending ? (
              <div className="mr-auto flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Thinking it through…
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
        )}

        <div className="sticky bottom-0 mt-6 bg-background pb-4 pt-2">
          <div className="flex items-end gap-2">
            <Textarea
              rows={2}
              placeholder="Ask your tutor…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              className="resize-none"
            />
            <Button size="lg" onClick={() => send(input)} disabled={pending || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            The tutor guides you to the answer rather than handing it over.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
