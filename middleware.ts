import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/workflow(.*)",
  "/api/workflows(.*)",
  "/api/runs(.*)",
  "/api/execute(.*)",
  "/api/import(.*)",
  "/api/gemini(.*)",
  "/api/crop(.*)",
  "/api/transloadit(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) return;
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"]
};
