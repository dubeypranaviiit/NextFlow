import { auth } from "@clerk/nextjs/server";
import { hasClerkKeys } from "@/lib/clerk-env";

export async function getCurrentUserId() {
  if (!hasClerkKeys()) return "demo-user";

  const { userId } = await auth();
  return userId;
}
