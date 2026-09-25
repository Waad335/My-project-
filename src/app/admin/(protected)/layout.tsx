import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  // Re-checked against the database (active + role) on every request; each
  // page below additionally requires its own permission.
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <AdminSidebar adminName={admin.name || admin.email} role={admin.role} />
      <main className="flex-1 overflow-x-hidden p-6 sm:p-8">{children}</main>
    </div>
  );
}
