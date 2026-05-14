import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/current-user";

const cropSchema = z.object({
  inputUrl: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100)
});

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = cropSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid crop parameters", details: err }, { status: 400 });
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 30000));
    const sharp = (await import("sharp")).default;
    const source = await loadImageBuffer(body.inputUrl);
    const metadata = await sharp(source).metadata();
    const imageWidth = metadata.width ?? 1;
    const imageHeight = metadata.height ?? 1;
    const left = Math.max(0, Math.round((imageWidth * body.x) / 100));
    const top = Math.max(0, Math.round((imageHeight * body.y) / 100));
    const width = Math.max(1, Math.min(imageWidth - left, Math.round((imageWidth * body.width) / 100)));
    const height = Math.max(1, Math.min(imageHeight - top, Math.round((imageHeight * body.height) / 100)));

    const cropped = await sharp(source)
      .extract({ left, top, width, height })
      .png()
      .toBuffer();

    return NextResponse.json({
      outputUrl: `data:image/png;base64,${cropped.toString("base64")}`,
      crop: { x: body.x, y: body.y, width: body.width, height: body.height }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Crop processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function loadImageBuffer(inputUrl: string) {
  if (inputUrl.startsWith("data:")) {
    const [, data = ""] = inputUrl.split(",");
    return Buffer.from(data, "base64");
  }

  const response = await fetch(inputUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch image: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}
