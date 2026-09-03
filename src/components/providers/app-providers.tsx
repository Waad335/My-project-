"use client";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { ToastViewport } from "@/components/providers/toast-viewport";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CartDrawer />
      <ToastViewport />
    </>
  );
}
