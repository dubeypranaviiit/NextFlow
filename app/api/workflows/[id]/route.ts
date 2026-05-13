import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  GET /api/workflows/[id] — fetch single workflow with nodes, edges, runs */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  PUT /api/workflows/[id] — save full canvas state                    */
/* ------------------------------------------------------------------ */
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

  const body = saveSchema.parse(await request.json());

  /* Verify ownership */
  const existing = await prisma.workflow.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  /* Transactional update: delete old nodes/edges, recreate */
  await prisma.$transaction([
    prisma.workflowEdge.deleteMany({ where: { workflowId: id } }),
    prisma.workflowNode.deleteMany({ where: { workflowId: id } }),
    prisma.workflow.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        viewport: body.viewport,
        updatedAt: new Date()
      }
    }),
    ...(body.nodes.length > 0
      ? [
          prisma.workflowNode.createMany({
            data: body.nodes.map((node: any) => ({
              id: node.id,
              workflowId: id,
              type: node.type ?? node.data?.kind ?? "unknown",
              position: node.position ?? { x: 0, y: 0 },
              data: node.data ?? {}
            }))
          })
        ]
      : []),
    ...(body.edges.length > 0
      ? [
          prisma.workflowEdge.createMany({
            data: body.edges.map((edge: any) => ({
              id: edge.id,
              workflowId: id,
              source: edge.source,
              sourceHandle: edge.sourceHandle ?? null,
              target: edge.target,
              targetHandle: edge.targetHandle ?? null,
              data: edge.data ?? null
            }))
          })
        ]
      : [])
  ]);

  return NextResponse.json({ ok: true });
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
