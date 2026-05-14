import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { z } from "zod";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const workflow = await prisma.workflow.findFirst({
    where: { id, userId },
    include: {
      nodes: true,
      edges: true,
      runs: {
        orderBy: { startedAt: "desc" },
        take: 50,
        include: { nodeRuns: true }
      }
    }
  });
  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ workflow });
}
const saveSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }),
  nodes: z.array(z.any()),
  edges: z.array(z.any())
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body;
  try {
    body = saveSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body", details: err }, { status: 400 });
  }
  const seenNodeIds = new Set<string>();
  body.nodes = body.nodes.filter((n: any) => {
    if (seenNodeIds.has(n.id)) return false;
    seenNodeIds.add(n.id);
    return true;
  });
  const seenEdgeIds = new Set<string>();
  body.edges = body.edges.filter((e: any) => {
    if (seenEdgeIds.has(e.id)) return false;
    seenEdgeIds.add(e.id);
    return true;
  });
  const existing = await prisma.workflow.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {

    await prisma.$transaction(async (tx) => {
      await tx.workflowEdge.deleteMany({ where: { workflowId: id } });
      await tx.workflowNode.deleteMany({ where: { workflowId: id } });

      await tx.workflow.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
          viewport: body.viewport,
          updatedAt: new Date()
        }
      });

      if (body.nodes.length > 0) {
        await tx.workflowNode.createMany({
          data: body.nodes.map((node: any) => ({
            id: node.id,
            workflowId: id,
            type: node.type ?? node.data?.kind ?? "unknown",
            position: node.position ?? { x: 0, y: 0 },
            data: node.data ?? {}
          })),
          skipDuplicates: true
        });
      }

      if (body.edges.length > 0) {
        await tx.workflowEdge.createMany({
          data: body.edges.map((edge: any) => ({
            id: edge.id,
            workflowId: id,
            source: edge.source,
            sourceHandle: edge.sourceHandle ?? null,
            target: edge.target,
            targetHandle: edge.targetHandle ?? null,
            data: edge.data ?? null
          })),
          skipDuplicates: true
        });
      }
    }, { timeout: 30000, maxWait: 10000 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Workflow save error:", error);
    return NextResponse.json({ error: "Failed to save workflow" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/workflows/[id]                                          */
/* ------------------------------------------------------------------ */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.workflow.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.workflow.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
