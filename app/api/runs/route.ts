import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";

const runRequestSchema = z.object({
  workflowId: z.string(),
  scope: z.enum(["full", "partial", "single"]),
  nodeIds: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = runRequestSchema.parse(await request.json());
  if (process.env.DATABASE_URL) {
    const run = await prisma.workflowRun.create({
      data: {
        workflowId: payload.workflowId,
        userId,
        scope: payload.scope,
        state: "queued",
        durationMs: 0
      }
    });
    return NextResponse.json({ queued: true, run });
  }
  return NextResponse.json({ queued: true, payload });
}
