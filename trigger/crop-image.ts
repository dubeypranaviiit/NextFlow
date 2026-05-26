import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const cropPayloadSchema = z.object({
  inputUrl: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100)
});

export const cropImageTask = task({
  id: "crop-image-ffmpeg",
  run: async (payload: z.infer<typeof cropPayloadSchema>) => {
    const input = cropPayloadSchema.parse(payload);
    const startedAt = Date.now();
    console.log("[Trigger.dev] crop-image-ffmpeg started", {
      hasInputUrl: Boolean(input.inputUrl),
      inputKind: input.inputUrl.startsWith("data:") ? "data-url" : "remote-url",
      crop: {
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height
      }
    });
    console.log("[Trigger.dev] crop-image-ffmpeg waiting 30 seconds");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    const sharp = (await import("sharp")).default;
    const source = await loadImageBuffer(input.inputUrl);
    const metadata = await sharp(source).metadata();
    const imageWidth = metadata.width ?? 1;
    const imageHeight = metadata.height ?? 1;
    const left = Math.max(0, Math.round((imageWidth * input.x) / 100));
    const top = Math.max(0, Math.round((imageHeight * input.y) / 100));
    const width = Math.max(1, Math.min(imageWidth - left, Math.round((imageWidth * input.width) / 100)));
    const height = Math.max(1, Math.min(imageHeight - top, Math.round((imageHeight * input.height) / 100)));
    const cropped = await sharp(source)
      .extract({ left, top, width, height })
      .png()
      .toBuffer();
    console.log("[Trigger.dev] crop-image-ffmpeg finished", {
      durationMs: Date.now() - startedAt,
      sourceSize: { width: imageWidth, height: imageHeight },
      extractedSize: { width, height }
    });

    return {
      outputUrl: `data:image/png;base64,${cropped.toString("base64")}`,
      crop: {
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height
      }
    };
  }
});

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
