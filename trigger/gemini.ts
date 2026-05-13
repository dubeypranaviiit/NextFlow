import { GoogleGenerativeAI } from "@google/generative-ai";
import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const geminiPayloadSchema = z.object({
  prompt: z.string(),
  systemPrompt: z.string().optional(),
  model: z.string().default("gemini-3.1-pro")
});

export const geminiTask = task({
  id: "gemini-3-1-pro",
  run: async (payload: z.infer<typeof geminiPayloadSchema>) => {
    const input = geminiPayloadSchema.parse(payload);
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: input.model,
      systemInstruction: input.systemPrompt
    });
    const result = await model.generateContent(input.prompt);
    return { text: result.response.text() };
  }
});
