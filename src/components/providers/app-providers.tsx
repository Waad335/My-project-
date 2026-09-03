"use client";

import { useEffect } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ToastViewport } from "@/components/providers/toast-viewport";
import { useCartStore } from "@/store/cart-store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Cart hydration from localStorage is deferred (skipHydration: true on the
    // store) so the first client render matches the server exactly; do the
    // real rehydration once, after mount, so every cart-reading component
    // updates together in one ordinary re-render instead of a hydration diff.
    useCartStore.persist.rehydrate();
  }, []);

  return (
    <>
      {children}
      <CartDrawer />
      <ToastViewport />
    </>
  );
}
