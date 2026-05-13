import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createDefaultWorkflow } from "@/lib/sample-workflow";
import { prisma } from "@/server/db/prisma";
import { createWorkflowSchema } from "@/schemas/workflow";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.DATABASE_URL) {
    const workflows = await prisma.workflow.findMany({
      where: { userId },
      include: { nodes: true, edges: true },
      orderBy: { updatedAt: "desc" }
    });
    return NextResponse.json({ workflows });
  }
  return NextResponse.json({ workflows: [createDefaultWorkflow(userId)] });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = createWorkflowSchema.parse(await request.json());
  const workflow = createDefaultWorkflow(userId);
  if (process.env.DATABASE_URL) {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    });
    const saved = await prisma.workflow.create({
      data: {
        userId,
        name: body.name,
        description: workflow.description,
        viewport: workflow.viewport,
        nodes: {
          createMany: {
            data: workflow.nodes.map((node) => ({
              id: crypto.randomUUID(),
              type: node.type ?? node.data.kind,
              position: node.position,
              data: node.data
            }))
          }
        },
        edges: {
          createMany: {
            data: workflow.edges.map((edge) => ({
              id: edge.id,
              source: edge.source,
              sourceHandle: edge.sourceHandle,
              target: edge.target,
              targetHandle: edge.targetHandle,
              data: edge.data
            }))
          }
        }
      }
    });
    return NextResponse.json({ workflow: saved }, { status: 201 });
  }
  return NextResponse.json({ workflow: { ...workflow, id: crypto.randomUUID(), name: body.name } }, { status: 201 });
}
