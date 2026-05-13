import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { importWorkflowSchema } from "@/schemas/workflow";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = importWorkflowSchema.parse(await request.json());
  return NextResponse.json({ workflow: { ...payload, id: crypto.randomUUID(), userId, updatedAt: new Date().toISOString() } });
}
