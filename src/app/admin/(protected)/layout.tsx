import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <AdminSidebar adminName={session.user.name || session.user.email || "Admin"} />
      <main className="flex-1 overflow-x-hidden p-6 sm:p-8">{children}</main>
    </div>
  );
}
