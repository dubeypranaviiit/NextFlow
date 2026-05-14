import { GoogleGenerativeAI } from "@google/generative-ai";
import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const geminiPayloadSchema = z.object({
  prompt: z.string(),
  systemPrompt: z.string().optional(),
  model: z.string().default("gemini-2.0-flash"),
  imageUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional()
});

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

export const geminiTask = task({
  id: "gemini-3-1-pro",
  run: async (payload: z.infer<typeof geminiPayloadSchema>) => {
    const input = geminiPayloadSchema.parse(payload);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: resolveModelId(input.model),
      systemInstruction: input.systemPrompt
    });
    const parts: any[] = [{ text: input.prompt }];

    const imageUrls = input.imageUrls?.length ? input.imageUrls : input.imageUrl ? [input.imageUrl] : [];
    for (const imageUrl of imageUrls) {
      const imagePart = await imageUrlToPart(imageUrl);
      if (imagePart) parts.push(imagePart);
    }

    const result = await model.generateContent(parts);
    return { text: result.response.text() };
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
