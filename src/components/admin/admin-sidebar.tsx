"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Truck,
  Tag,
  Settings,
  LogOut,
  ExternalLink,
  Instagram,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can, type AdminRole, type Permission } from "@/lib/admin-permissions";
import { HeartIcon } from "@/components/icons/decorative";

// Each entry is shown only to roles with its permission. Hiding links is a
// convenience — access itself is enforced by middleware and server guards.
const NAV: { href: string; label: string; icon: typeof LayoutDashboard; permission: Permission; exact?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view", exact: true },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products.view" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, permission: "categories.manage" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders.view" },
  { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers.view" },
  { href: "/admin/shipping", label: "Shipping", icon: Truck, permission: "shipping.manage" },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: Tag, permission: "promos.manage" },
  { href: "/admin/instagram", label: "Instagram", icon: Instagram, permission: "instagram.manage" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
];

export function AdminSidebar({ adminName, role }: { adminName: string; role: AdminRole }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-e border-mocha-700/10 bg-white">
      <div className="flex items-center gap-1.5 border-b border-mocha-700/10 px-5 py-5">
        <span className="font-heading text-xl text-mocha-700">DODANA</span>
        <HeartIcon className="h-3 w-3 text-blush-400" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.filter((item) => can(role, item.permission)).map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-mocha-700 text-ivory" : "text-mocha-600 hover:bg-mocha-700/5"
              )}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-mocha-700/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-mocha-500 hover:bg-mocha-700/5"
        >
          <ExternalLink size={16} />
          View Store
        </a>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-mocha-500 hover:bg-mocha-700/5"
        >
          <LogOut size={16} />
          Sign Out ({adminName}{role === "STAFF" ? " · Staff" : ""})
        </button>
      </div>
    </aside>
  );
}
