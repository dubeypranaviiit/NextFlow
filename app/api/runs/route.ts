import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getCurrentUserId } from "@/lib/current-user";

const runRequestSchema = z.object({
  workflowId: z.string(),
  scope: z.enum(["full", "partial", "single"]),
  nodeIds: z.array(z.string()).optional()
});

/* POST /api/runs — create a new workflow run record */
export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = runRequestSchema.parse(await request.json());

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

/* GET /api/runs?workflowId=xxx — list runs for a workflow */
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
