import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/current-user";

const geminiSchema = z.object({
  prompt: z.string().min(1),
  systemPrompt: z.string().optional(),
  model: z.string().default("gemini-2.0-flash"),
  imageUrl: z.string().optional()
});

/* Map human-readable model names to actual Gemini model IDs */
function resolveModelId(model: string): string {
  const map: Record<string, string> = {
    "Gemini 3.1 Pro": "gemini-2.0-flash",
    "Gemini 2.0 Flash": "gemini-2.0-flash",
    "Gemini 1.5 Pro": "gemini-1.5-pro",
    "Gemini 1.5 Flash": "gemini-1.5-flash",
    "gemini-3.1-pro": "gemini-2.0-flash",
    "gemini-2.0-flash": "gemini-2.0-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-1.5-flash": "gemini-1.5-flash"
  };
  return map[model] ?? "gemini-2.0-flash";
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = geminiSchema.parse(await request.json());

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelId = resolveModelId(body.model);
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: body.systemPrompt || undefined
    });

    const parts: any[] = [{ text: body.prompt }];

    /* If image URL is provided, fetch and attach as vision input */
    if (body.imageUrl) {
      try {
        const imgRes = await fetch(body.imageUrl);
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
          parts.push({
            inlineData: { mimeType, data: base64 }
          });
        }
      } catch {
        /* Image fetch failed, proceed without image */
      }
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
