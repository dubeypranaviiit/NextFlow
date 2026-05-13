import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { createWorkflowSchema } from "@/schemas/workflow";
import { getCurrentUserId } from "@/lib/current-user";
import { createDefaultWorkflow } from "@/lib/sample-workflow";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  /* Ensure user row exists */
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId }
  });

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    include: { nodes: true, edges: true },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json({ workflows });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = createWorkflowSchema.parse(await request.json());

  /* Ensure user row exists */
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId }
  });

  const template = createDefaultWorkflow(userId, `workflow-${Date.now()}`);

  const saved = await prisma.workflow.create({
    data: {
      userId,
      name: body.name,
      description: template.description,
      viewport: template.viewport,
      nodes: {
        createMany: {
          data: template.nodes.map((node) => ({
            id: node.id,
            type: node.type ?? node.data.kind,
            position: node.position,
            data: node.data as any
          }))
        }
      },
      edges: {
        createMany: {
          data: template.edges.map((edge) => ({
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

  return NextResponse.json({ workflow: saved }, { status: 201 });
}
