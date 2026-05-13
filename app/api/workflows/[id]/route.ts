import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createDefaultWorkflow } from "@/lib/sample-workflow";
import { prisma } from "@/server/db/prisma";
import { workflowSchema } from "@/schemas/workflow";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (process.env.DATABASE_URL) {
    const workflow = await prisma.workflow.findFirst({
      where: { id, userId },
      include: { nodes: true, edges: true }
    });
    if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ workflow });
  }
  return NextResponse.json({ workflow: { ...createDefaultWorkflow(userId), id } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const workflow = workflowSchema.parse(await request.json());
  if (process.env.DATABASE_URL) {
    await prisma.workflow.update({
      where: { id, userId },
      data: {
        name: workflow.name,
        description: workflow.description,
        viewport: workflow.viewport,
        status: workflow.status
      }
    });
  }
  return NextResponse.json({ workflow });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (process.env.DATABASE_URL) {
    await prisma.workflow.delete({ where: { id, userId } });
  }
  return NextResponse.json({ ok: true });
}
