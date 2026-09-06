"use client";

import { useEffect } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ToastViewport } from "@/components/providers/toast-viewport";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Cart/wishlist hydration from localStorage is deferred (skipHydration:
    // true on both stores) so the first client render matches the server
    // exactly; do the real rehydration once, after mount, so every reading
    // component updates together in one ordinary re-render instead of a
    // hydration diff.
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
  }, []);

  return (
    <>
      {children}
      <CartDrawer />
      <ToastViewport />
    </>
  );
}
