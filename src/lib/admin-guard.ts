import { cache } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, isAdminRole, type AdminRole, type Permission } from "@/lib/admin-permissions";

export type AdminContext = { id: string; email: string; name: string; role: AdminRole };

/**
 * The signed-in admin, re-read from the database on every request: role and
 * `isActive` come from the admin_users row, not from the 8-hour session
 * token, so deactivating an admin or changing their role takes effect on
 * their very next request. Cached per request (layout + page + guard share
 * one lookup).
 */
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  const admin = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!admin || !admin.isActive || !isAdminRole(admin.role)) return null;
  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
});

/**
 * API route guard. 401 when not signed in as an active admin, 403 when the
 * admin's role lacks `permission`. `middleware.ts` applies the same rules
 * earlier (from the session token); this is the authoritative check.
 */
export async function requireAdminPermission(permission: Permission) {
  const admin = await getAdminContext();
  if (!admin) {
    return { admin: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!can(admin.role, permission)) {
    return { admin: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { admin, response: null };
}

/**
 * Page guard for server components under /admin: sends signed-out/inactive
 * admins to the login page and roles without `permission` to /admin/denied.
 * Returns the admin (with role) for role-dependent rendering.
 */
export async function requireAdminPage(permission: Permission): Promise<AdminContext> {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");
  if (!can(admin.role, permission)) redirect("/admin/denied");
  return admin;
}
