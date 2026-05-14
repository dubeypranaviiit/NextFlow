import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/current-user";

const groqSchema = z.object({
  prompt: z.string().min(1),
  systemPrompt: z.string().optional(),
  model: z.string().default("llama-3.3-70b-versatile"),
});

function resolveGroqModel(model: string): string {
  const map: Record<string, string> = {
    "Llama 3.3 70B": "llama-3.3-70b-versatile",
    "Llama 3.1 8B": "llama-3.1-8b-instant",
    "Mixtral 8x7B": "mixtral-8x7b-32768",
    "Gemma 2 9B": "gemma2-9b-it",
   
    "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant": "llama-3.1-8b-instant",
    "mixtral-8x7b-32768": "mixtral-8x7b-32768",
    "gemma2-9b-it": "gemma2-9b-it",
  };
  return map[model] ?? "llama-3.3-70b-versatile";
}

const GROQ_FALLBACKS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

async function callGroq(
  apiKey: string,
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<
  | { ok: true; text: string }
  | { ok: false; status: number; error: string }
> {
  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: data?.error?.message || `Groq API error: ${res.status}`,
    };
  }

  const text =
    data?.choices?.[0]?.message?.content ?? "No response generated";
  return { ok: true, text };
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured" },
      { status: 500 }
    );
  }

  let body;
  try {
    body = groqSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", details: err },
      { status: 400 }
    );
  }

  try {
    const primaryModel = resolveGroqModel(body.model);
    const modelsToTry = [
      primaryModel,
      ...GROQ_FALLBACKS.filter((m) => m !== primaryModel),
    ];

    for (const modelId of modelsToTry) {
      console.log(`[Groq] Trying model: ${modelId}`);
      const result = await callGroq(
        apiKey,
        modelId,
        body.prompt,
        body.systemPrompt
      );

      if (result.ok) {
        console.log(`[Groq] Success with model: ${modelId}`);
        return NextResponse.json({ text: result.text });
      }

      if (result.status === 429) {
        console.warn(
          `[Groq] Rate limited on ${modelId}, trying next model...`
        );
        continue;
      }

      console.error(`[Groq] Error on ${modelId}:`, result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log("[Groq] All models rate-limited. Waiting 5s and retrying...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const retryResult = await callGroq(
      apiKey,
      primaryModel,
      body.prompt,
      body.systemPrompt
    );
    if (retryResult.ok) {
      return NextResponse.json({ text: retryResult.text });
    }

    return NextResponse.json(
      {
        error:
          "All Groq models are rate-limited. Please wait a moment and try again.",
      },
      { status: 429 }
    );
  } catch (error: any) {
    console.error("[Groq] Request failed:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Groq API call failed" },
      { status: 500 }
    );
  }
}
