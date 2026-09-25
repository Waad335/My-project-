"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ToastViewport } from "@/components/providers/toast-viewport";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useAccountSync } from "@/hooks/use-account-sync";

export function AppProviders({ children, customerId }: { children: React.ReactNode; customerId: string | null }) {
  useEffect(() => {
    // Cart/wishlist hydration from localStorage is deferred (skipHydration:
    // true on both stores) so the first client render matches the server
    // exactly; do the real rehydration once, after mount, so every reading
    // component updates together in one ordinary re-render instead of a
    // hydration diff.
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
  }, []);

  useAccountSync(customerId);

  return (
    // reducedMotion="user": Framer Motion drops transform animations (keeps
    // gentle opacity fades) for visitors who ask their OS for less motion.
    <MotionConfig reducedMotion="user">
      {children}
      <CartDrawer />
      <ToastViewport />
    </MotionConfig>
  );
}
