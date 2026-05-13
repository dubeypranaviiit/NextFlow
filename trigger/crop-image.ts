import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

const cropPayloadSchema = z.object({
  inputUrl: z.string().url(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100)
});

export const cropImageTask = task({
  id: "crop-image-ffmpeg",
  run: async (payload: z.infer<typeof cropPayloadSchema>) => {
    const input = cropPayloadSchema.parse(payload);
    await new Promise((resolve) => setTimeout(resolve, 30000));
    return {
      outputUrl: input.inputUrl,
      crop: {
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height
      }
    };
  }
});
