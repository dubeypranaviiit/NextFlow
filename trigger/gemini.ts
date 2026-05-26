import { GoogleGenerativeAI } from "@google/generative-ai";
import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const geminiPayloadSchema = z.object({
  prompt: z.string(),
  systemPrompt: z.string().optional(),
  model: z.string().default("gemini-2.5-flash"),
  imageUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional()
});

function resolveModelId(model: string): string {
  const map: Record<string, string> = {
    // UI labels
    "Gemini 2.5 Flash": "gemini-2.5-flash",
    "Gemini 1.5 Flash": "gemini-1.5-flash",
    "Gemini 1.5 Pro": "gemini-1.5-pro",

    // old labels mapped safely
    "Gemini 2.0 Flash": "gemini-2.5-flash",
    "Gemini 3.1 Pro": "gemini-2.5-flash",

    // direct ids
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-1.5-flash": "gemini-1.5-flash",
    "gemini-1.5-pro": "gemini-1.5-pro"
  };
  return map[model] ?? "gemini-2.5-flash";
}

export const geminiTask = task({
  id: "gemini-2.5-flash",
  run: async (payload: z.infer<typeof geminiPayloadSchema>) => {
    const input = geminiPayloadSchema.parse(payload);
    const startedAt = Date.now();
    const imageUrls = input.imageUrls?.length ? input.imageUrls : input.imageUrl ? [input.imageUrl] : [];
    console.log("[Trigger.dev] gemini-2.5-flash started", {
      model: input.model,
      promptLength: input.prompt.length,
      hasSystemPrompt: Boolean(input.systemPrompt),
      imageCount: imageUrls.length
    });
    const apiKey = cleanEnvSecret(process.env.GEMINI_API_KEY);
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: resolveModelId(input.model),
        systemInstruction: input.systemPrompt
      });
      const parts: any[] = [{ text: input.prompt }];

      for (const imageUrl of imageUrls) {
        const imagePart = await imageUrlToPart(imageUrl);
        if (imagePart) parts.push(imagePart);
      }

      const result = await model.generateContent(parts);
      const text = result.response.text();
      console.log("[Trigger.dev] gemini-2.5-flash finished", {
        provider: "gemini",
        durationMs: Date.now() - startedAt,
        outputLength: text.length
      });
      return { text };
    } catch (error) {
      if (!shouldFallbackToGroq(error)) throw error;
      console.log("[Trigger.dev] gemini-2.5-flash falling back to Groq", {
        reason: getErrorMessage(error),
        imageCount: imageUrls.length
      });
      const text = await runGroqFallback(input.prompt, input.systemPrompt, imageUrls.length);
      console.log("[Trigger.dev] gemini-2.5-flash finished", {
        provider: "groq-fallback",
        durationMs: Date.now() - startedAt,
        outputLength: text.length
      });
      return { text };
    }
  }
});

async function imageUrlToPart(imageUrl: string) {
  const dataUrl = parseDataUrl(imageUrl);
  if (dataUrl) {
    return {
      inlineData: {
        mimeType: dataUrl.mimeType,
        data: dataUrl.data
      }
    };
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) return null;
  const buffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
  return { inlineData: { mimeType, data: base64 } };
}

function parseDataUrl(url: string) {
  const match = url.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function cleanEnvSecret(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "");
}

function shouldFallbackToGroq(error: unknown) {
  if (!process.env.GROQ_API_KEY) return false;
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("invalid api key") ||
    message.includes("api key not valid") ||
    message.includes("permission") ||
    message.includes("quota") ||
    message.includes("rate") ||
    message.includes("overloaded") ||
    message.includes("high demand")
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function runGroqFallback(prompt: string, systemPrompt: string | undefined, imageCount: number) {
  const apiKey = cleanEnvSecret(process.env.GROQ_API_KEY);
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const imageContext = imageCount
    ? `\n\nThere are ${imageCount} upstream image input(s). Use the supplied product/context text to produce the final marketing copy.`
    : "";
  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: `${prompt}${imageContext}` });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Groq fallback API error: ${response.status}`);
  }

  return data?.choices?.[0]?.message?.content ?? "No response generated";
}
