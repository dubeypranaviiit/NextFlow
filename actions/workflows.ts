"use server";

import { prisma } from "@/server/db/prisma";
import { getCurrentUserId } from "@/lib/current-user";

export async function getUserWorkflows() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    include: { nodes: true, edges: true },
    orderBy: { updatedAt: "desc" }
  });

  return workflows;
}
