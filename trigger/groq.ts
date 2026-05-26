import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const groqPayloadSchema = z.object({
  prompt: z.string().min(1),
  systemPrompt: z.string().optional(),
  model: z.string().default("llama-3.3-70b-versatile")
});

const GROQ_FALLBACKS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768"
];

export const groqTask = task({
  id: "groq-llm",
  run: async (payload: z.infer<typeof groqPayloadSchema>) => {
    const input = groqPayloadSchema.parse(payload);
    const startedAt = Date.now();
    console.log("[Trigger.dev] groq-llm started", {
      model: input.model,
      promptLength: input.prompt.length,
      hasSystemPrompt: Boolean(input.systemPrompt)
    });
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

    const primaryModel = resolveGroqModelId(input.model);
    const modelsToTry = [
      primaryModel,
      ...GROQ_FALLBACKS.filter((model) => model !== primaryModel)
    ];

    for (const modelId of modelsToTry) {
      console.log("[Trigger.dev] groq-llm trying model", { model: modelId });
      const result = await callGroq(apiKey, modelId, input.prompt, input.systemPrompt);
      if (result.ok) {
        console.log("[Trigger.dev] groq-llm finished", {
          model: modelId,
          durationMs: Date.now() - startedAt,
          outputLength: result.text.length
        });
        return { text: result.text, model: modelId };
      }
      console.log("[Trigger.dev] groq-llm model failed", {
        model: modelId,
        status: result.status
      });
      if (result.status !== 429) throw new Error(result.error);
    }

    throw new Error("All Groq models are rate-limited. Please wait a moment and try again.");
  }
});

async function callGroq(
  apiKey: string,
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data?.error?.message || `Groq API error: ${response.status}`
    };
  }

  return {
    ok: true,
    text: data?.choices?.[0]?.message?.content ?? "No response generated"
  };
}

function resolveGroqModelId(model: string) {
  const map: Record<string, string> = {
    "Llama 3.3 70B": "llama-3.3-70b-versatile",
    "Llama 3.1 8B": "llama-3.1-8b-instant",
    "Mixtral 8x7B": "mixtral-8x7b-32768",
    "Gemma 2 9B": "gemma2-9b-it",
    "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant": "llama-3.1-8b-instant",
    "mixtral-8x7b-32768": "mixtral-8x7b-32768",
    "gemma2-9b-it": "gemma2-9b-it"
  };
  return map[model] ?? "llama-3.3-70b-versatile";
}
