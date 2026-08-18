/**
 * Thin, replaceable transport for the Lovable AI Gateway.
 * Every AI capability in the app goes through here so models/providers
 * can be swapped in one place.
 */

const ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export const MODELS = {
  reasoning: "google/gemini-3.5-flash",
  fast: "google/gemini-2.5-flash-lite",
} as const;

export async function chat(
  messages: AIMessage[],
  opts: { model?: string; temperature?: number } = {},
): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? MODELS.reasoning,
      temperature: opts.temperature ?? 0.4,
      messages,
    }),
  });

  if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
  if (!res.ok) {
    const text = await res.text();
    console.error("AI gateway error", res.status, text);
    throw new Error("The AI service failed to respond.");
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

/** Extracts the first JSON value from a model response. */
export function parseJson<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) text = fence[1].trim();
  const start = text.search(/[[{]/);
  if (start > 0) text = text.slice(start);
  const lastObj = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (lastObj > -1) text = text.slice(0, lastObj + 1);
  return JSON.parse(text) as T;
}

export async function chatJson<T>(
  messages: AIMessage[],
  opts: { model?: string; temperature?: number } = {},
): Promise<T> {
  const raw = await chat(
    [
      ...messages,
      {
        role: "system",
        content: "Respond with raw JSON only. No prose, no markdown fences, no commentary.",
      },
    ],
    opts,
  );
  try {
    return parseJson<T>(raw);
  } catch {
    console.error("AI returned unparseable JSON:", raw.slice(0, 800));
    throw new Error("The AI returned an unexpected response. Please retry.");
  }
}
