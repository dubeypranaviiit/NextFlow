import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getCurrentUserId } from "@/lib/current-user";

const updateRunSchema = z.object({
  state: z.enum(["queued", "running", "success", "failed"]),
  durationMs: z.number().int().min(0)
});

const nodeRunSchema = z.object({
  nodeId: z.string(),
  nodeTitle: z.string(),
  state: z.enum(["queued", "running", "success", "failed"]),
  durationMs: z.number().int().min(0),
  output: z.any().optional(),
  error: z.string().nullish()   
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const run = await prisma.workflowRun.findFirst({
    where: { id, userId },
    include: { nodeRuns: { orderBy: { startedAt: "asc" } } }
  });
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ run });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await request.json();
  const runData = updateRunSchema.parse(body);

  const existing = await prisma.workflowRun.findFirst({
    where: { id, userId },
    select: { id: true }
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.workflowRun.update({
    where: { id },
    data: {
      state: runData.state,
      durationMs: runData.durationMs
    }
  });

  if (body.nodeRuns && Array.isArray(body.nodeRuns)) {
    const parsed = body.nodeRuns.map((nr: any) => nodeRunSchema.parse(nr));
    if (parsed.length > 0) {
      await prisma.nodeRun.createMany({
        data: parsed.map((nr: any) => ({
          workflowRunId: id,
          nodeId: nr.nodeId,
          nodeTitle: nr.nodeTitle,
          state: nr.state,
          durationMs: nr.durationMs,
          output: nr.output ?? null,
          error: nr.error ?? null
        }))
      });
    }
  }

  return NextResponse.json({ run: updated });
}
