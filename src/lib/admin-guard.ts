import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

/**
 * Defense-in-depth session check for admin API routes. `middleware.ts`
 * already blocks unauthenticated requests to /api/admin/*; this re-checks
 * inside the route handler so a route is never accidentally reachable if
 * the middleware matcher ever changes.
 */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}
