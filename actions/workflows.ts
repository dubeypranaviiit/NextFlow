"use server";

import { auth } from "@clerk/nextjs/server";
import { createDefaultWorkflow } from "@/lib/sample-workflow";

export async function getUserWorkflows() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return [createDefaultWorkflow(userId)];
}
