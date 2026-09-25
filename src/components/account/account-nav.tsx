"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Heart, LogOut, Package, User } from "lucide-react";
import { logoutAction } from "@/lib/account-actions";
import { clearAccountSyncMarker } from "@/hooks/use-account-sync";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const t = useTranslations("account");
  const pathname = usePathname();
  const links = [
    { href: "/account", label: t("navProfile"), icon: User },
    { href: "/account/orders", label: t("navOrders"), icon: Package },
    { href: "/account/wishlist", label: t("navWishlist"), icon: Heart },
  ];
  return (
    <nav aria-label={t("accountNav")} className="-mx-4 overflow-x-auto px-4 scrollbar-hide lg:mx-0 lg:px-0">
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-medium transition-colors lg:rounded-2xl lg:px-4 lg:py-3",
                  active ? "bg-mocha-700 text-ivory" : "text-mocha-600 hover:bg-sand-100 hover:text-mocha-800"
                )}
              >
                <link.icon size={17} strokeWidth={1.75} aria-hidden="true" />
                {link.label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-4 lg:border-t lg:border-mocha-700/8 lg:pt-4">
          <LogoutButton />
        </li>
      </ul>
    </nav>
  );
}

// Signing out also clears this device's local cart and wishlist — they're
// saved to the account, and shouldn't linger on a shared device.
export function LogoutButton() {
  const t = useTranslations("account");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logoutAction();
          clearAccountSyncMarker();
          useCartStore.getState().clear();
          useWishlistStore.setState({ items: [] });
          router.push("/");
          router.refresh();
        })
      }
      className="flex w-full items-center gap-3 rounded-full px-5 py-2.5 text-sm font-medium text-mocha-500 transition-colors hover:bg-sand-100 hover:text-mocha-800 disabled:opacity-50 lg:rounded-2xl lg:px-4 lg:py-3"
    >
      <LogOut size={17} strokeWidth={1.75} aria-hidden="true" />
      {pending ? t("signingOut") : t("signOut")}
    </button>
  );
}
