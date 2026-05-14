import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { createDefaultWorkflow, SYSTEM_WORKFLOW_NAME } from "@/lib/sample-workflow";
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId }
  });


  const existing = await prisma.workflow.findFirst({
    where: { userId, name: SYSTEM_WORKFLOW_NAME },
    include: { nodes: true, edges: true }
  });


  const sample = createDefaultWorkflow(userId, existing?.id ?? `template-${Date.now()}`);
  if (
    existing &&
    existing.description === sample.description &&
    existing.nodes.length >= 7 &&
    existing.edges.length >= 8
  ) {
    return NextResponse.json({ workflow: existing, seeded: false });
  }

  if (existing) {
    await prisma.$transaction([
      prisma.workflowEdge.deleteMany({ where: { workflowId: existing.id } }),
      prisma.workflowNode.deleteMany({ where: { workflowId: existing.id } }),
      prisma.workflow.update({
        where: { id: existing.id },
        data: {
          name: sample.name,
          description: sample.description,
          viewport: sample.viewport,
          updatedAt: new Date()
        }
      }),
      prisma.workflowNode.createMany({
        data: sample.nodes.map((node) => ({
          id: node.id,
          workflowId: existing.id,
          type: node.type ?? node.data.kind,
          position: node.position,
          data: node.data as any
        }))
      }),
      prisma.workflowEdge.createMany({
        data: sample.edges.map((edge) => ({
          id: edge.id,
          workflowId: existing.id,
          source: edge.source,
          sourceHandle: edge.sourceHandle ?? null,
          target: edge.target,
          targetHandle: edge.targetHandle ?? null,
          data: (edge.data ?? undefined) as any
        }))
      })
    ]);

    const repaired = await prisma.workflow.findUnique({
      where: { id: existing.id },
      include: { nodes: true, edges: true }
    });
    return NextResponse.json({ workflow: repaired, seeded: false, repaired: true });
  }

  const saved = await prisma.workflow.create({
    data: {
      userId,
      name: sample.name,
      description: sample.description,
      viewport: sample.viewport,
      nodes: {
        createMany: {
          data: sample.nodes.map((node) => ({
            id: node.id,
            type: node.type ?? node.data.kind,
            position: node.position,
            data: node.data as any
          }))
        }
      },
      edges: {
        createMany: {
          data: sample.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            sourceHandle: edge.sourceHandle ?? null,
            target: edge.target,
            targetHandle: edge.targetHandle ?? null,
            data: (edge.data ?? undefined) as any
          }))
        }
      }
    },
    include: { nodes: true, edges: true }
  });

  return NextResponse.json({ workflow: saved, seeded: true }, { status: 201 });
}
