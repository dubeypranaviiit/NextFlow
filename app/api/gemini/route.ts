import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/current-user";

const geminiSchema = z.object({
  prompt: z.string().min(1),
  systemPrompt: z.string().optional(),
  model: z.string().default("gemini-2.5-flash"),
  imageUrl: z.string().optional()
});

function resolveModelId(model: string): string {
  const map: Record<string, string> = {
    "Gemini 1.5 Flash": "gemini-1.5-flash",
    "Gemini 2.0 Flash": "gemini-2.5-flash",
    "Gemini 2.5 Flash": "gemini-2.5-flash",
    "Gemini 3.1 Pro": "gemini-2.5-flash",

   
    "gemini-1.5-flash": "gemini-1.5-flash",
    "gemini-2.5-flash": "gemini-2.5-flash"
  };

  return map[model] ?? "gemini-2.5-flash";
}

const MODEL_FALLBACKS: string[] = [
  "gemini-2.5-flash",
  "gemini-1.5-flash"
];

function parseDataUrl(
  url: string
): { mimeType: string; data: string } | null {
  const match = url.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) return null;

  return {
    mimeType: match[1],
    data: match[2]
  };
}

async function callGemini(
  apiKey: string,
  modelId: string,
  parts: any[],
  systemPrompt?: string
): Promise<
  | { ok: true; text: string }
  | { ok: false; status: number; error: string; retryAfter?: number }
> {
  const requestBody: any = {
    contents: [{ parts }]
  };

  if (systemPrompt) {
    requestBody.system_instruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  const data = await res.json();

  console.log("[Gemini Response]", data);

  if (!res.ok) {
    const retryDetail = data?.error?.details?.find((d: any) =>
      d["@type"]?.includes("RetryInfo")
    );

    const retryAfter = retryDetail?.retryDelay
      ? parseInt(retryDetail.retryDelay)
      : undefined;

    return {
      ok: false,
      status: res.status,
      error:
        data?.error?.message || `Gemini API error: ${res.status}`,
      retryAfter
    };
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "No response generated";

  return {
    ok: true,
    text
  };
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  let body;

  try {
    body = geminiSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: err
      },
      { status: 400 }
    );
  }

  try {
    const primaryModel = resolveModelId(body.model);

    const parts: any[] = [
      {
        text: body.prompt
      }
    ];

    if (body.imageUrl) {
      const parsed = parseDataUrl(body.imageUrl);

      if (parsed) {
        parts.push({
          inline_data: {
            mime_type: parsed.mimeType,
            data: parsed.data
          }
        });
      } else {
        try {
          const imageResponse = await fetch(body.imageUrl);

          if (imageResponse.ok) {
            const buffer = await imageResponse.arrayBuffer();

            const base64 = Buffer.from(buffer).toString("base64");

            const mimeType =
              imageResponse.headers.get("content-type") ||
              "image/jpeg";

            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            });
          }
        } catch (error) {
          console.error("[Gemini] Image fetch failed", error);
        }
      }
    }

    const modelsToTry = [
      primaryModel,
      ...MODEL_FALLBACKS.filter((m) => m !== primaryModel)
    ];

    for (const modelId of modelsToTry) {
      console.log(`[Gemini] Trying model: ${modelId}`);

      const result = await callGemini(
        apiKey,
        modelId,
        parts,
        body.systemPrompt
      );

      if (result.ok) {
        console.log(`[Gemini] Success with model: ${modelId}`);

        return NextResponse.json({
          text: result.text,
          model: modelId
        });
      }

      if (result.status === 429) {
        console.warn(
          `[Gemini] Rate limited on ${modelId}, trying next model...`
        );

        continue;
      }

      console.error(
        `[Gemini] Error on ${modelId}:`,
        result.error
      );

      return NextResponse.json(
        {
          error: result.error
        },
        { status: result.status || 500 }
      );
    }

    console.log(
      "[Gemini] All models rate-limited. Waiting 60s and retrying..."
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 60000)
    );

    const retryResult = await callGemini(
      apiKey,
      primaryModel,
      parts,
      body.systemPrompt
    );

    if (retryResult.ok) {
      return NextResponse.json({
        text: retryResult.text,
        model: primaryModel
      });
    }

    return NextResponse.json(
      {
        error:
          "All Gemini models are rate-limited. Please wait a minute and try again."
      },
      { status: 429 }
    );
  } catch (error: any) {
    console.error(
      "[Gemini] Request failed:",
      error?.message || error
    );

    return NextResponse.json(
      {
        error:
          error?.message || "Gemini API call failed"
      },
      { status: 500 }
    );
  }
}