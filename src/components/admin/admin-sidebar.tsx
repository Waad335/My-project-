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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HeartIcon } from "@/components/icons/decorative";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: Tag },
  { href: "/admin/instagram", label: "Instagram", icon: Instagram },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-e border-mocha-700/10 bg-white">
      <div className="flex items-center gap-1.5 border-b border-mocha-700/10 px-5 py-5">
        <span className="font-heading text-xl text-mocha-700">DODANA</span>
        <HeartIcon className="h-3 w-3 text-blush-400" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map((item) => {
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
          Sign Out ({adminName})
        </button>
      </div>
    </aside>
  );
}
