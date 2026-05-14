import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { importWorkflowSchema } from "@/schemas/workflow";
import { getCurrentUserId } from "@/lib/current-user";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = importWorkflowSchema.parse(await request.json());

 
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId }
  });

  
  const saved = await prisma.workflow.create({
    data: {
      userId,
      name: payload.name,
      description: payload.description ?? "",
      viewport: payload.viewport ?? { x: 400, y: 300, zoom: 0.5 },
      nodes: {
        createMany: {
          data: (payload.nodes ?? []).map((node: any) => ({
            id: node.id ?? crypto.randomUUID(),
            type: node.type ?? node.data?.kind ?? "unknown",
            position: node.position ?? { x: 0, y: 0 },
            data: node.data ?? {}
          }))
        }
      },
      edges: {
        createMany: {
          data: (payload.edges ?? []).map((edge: any) => ({
            id: edge.id ?? crypto.randomUUID(),
            source: edge.source,
            sourceHandle: edge.sourceHandle ?? null,
            target: edge.target,
            targetHandle: edge.targetHandle ?? null,
            data: edge.data ?? null
          }))
        }
      }
    },
    include: { nodes: true, edges: true }
  });

  return NextResponse.json({ workflow: saved }, { status: 201 });
}
