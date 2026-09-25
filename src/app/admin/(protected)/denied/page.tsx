import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

// Where middleware and page guards send an admin whose role doesn't include
// the page they asked for.
export default async function AdminDeniedPage() {
  const admin = await requireAdminPage("dashboard.view");
  return (
    <div className="card-surface mx-auto mt-10 flex max-w-lg flex-col items-center gap-4 p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush-100 text-blush-600">
        <ShieldAlert size={22} aria-hidden="true" />
      </span>
      <h1 className="font-heading text-2xl text-mocha-700">No access to this page</h1>
      <p className="text-sm leading-relaxed text-mocha-600">
        Your role ({admin.role === "STAFF" ? "Staff" : "Admin"}) doesn&apos;t include access to that page. Ask a DODANA
        admin if you need it.
      </p>
      <Link href="/admin" className="btn-primary mt-2">
        Back to dashboard
      </Link>
    </div>
  );
}
