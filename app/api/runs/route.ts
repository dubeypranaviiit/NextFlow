import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getCurrentUserId } from "@/lib/current-user";

const runRequestSchema = z.object({
  workflowId: z.string(),
  scope: z.enum(["full", "partial", "single"]),
  nodeIds: z.array(z.string()).optional()
});
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = runRequestSchema.parse(await request.json());
  const workflow = await prisma.workflow.findFirst({
    where: { id: payload.workflowId, userId },
    select: { id: true }
  });
  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: payload.workflowId,
      userId,
      scope: payload.scope,
      state: "queued",
      durationMs: 0
    }
  });

  return NextResponse.json({ run });
}
export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const workflowId = url.searchParams.get("workflowId");

  const where: any = { userId };
  if (workflowId) where.workflowId = workflowId;

  const runs = await prisma.workflowRun.findMany({
    where,
    include: { nodeRuns: true },
    orderBy: { startedAt: "desc" },
    take: 50
  });

  return NextResponse.json({ runs });
}
