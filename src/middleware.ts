import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminRole, permissionForAdminApi, permissionForAdminPage, roleMayAccess } from "@/lib/admin-permissions";

// First line of admin access control: signed-out requests go to the login
// page (or get 401), and roles without access to a route are turned away
// before any page or handler runs. The role here comes from the session
// token; every page/handler re-checks against the database
// (src/lib/admin-guard.ts), which is the authoritative check.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";

  if (!isAdminApi && !isAdminPage) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = isAdminRole(token.role) ? token.role : null;
  const permission = isAdminApi ? permissionForAdminApi(pathname, request.method) : permissionForAdminPage(pathname);
  if (!roleMayAccess(role, permission)) {
    if (isAdminApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (pathname !== "/admin/denied") return NextResponse.redirect(new URL("/admin/denied", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
