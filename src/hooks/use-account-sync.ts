"use client";

import { useEffect } from "react";
import { useCartStore, type CartItem } from "@/store/cart-store";
import { useWishlistStore, type WishlistItem } from "@/store/wishlist-store";

// Remembers which account this device's local cart/wishlist were last synced
// with. First sync for an account on a device merges local + saved; after
// that the saved copy is authoritative (so removals on another device stick).
export const SYNCED_ACCOUNT_KEY = "dodana-synced-account";
const PUSH_DELAY_MS = 800;

type HydratableStore = {
  persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void };
};

function whenHydrated(store: HydratableStore): Promise<void> {
  return new Promise((resolve) => {
    if (store.persist.hasHydrated()) return resolve();
    const unsub = store.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

const lineKey = (i: { productId: string; variantId: string | null }) => `${i.productId}:${i.variantId ?? ""}`;

function readSyncedAccount(): string | null {
  try {
    return localStorage.getItem(SYNCED_ACCOUNT_KEY);
  } catch {
    return null;
  }
}

export function clearAccountSyncMarker() {
  try {
    localStorage.removeItem(SYNCED_ACCOUNT_KEY);
  } catch {
    /* storage unavailable */
  }
}

// Keeps a signed-in customer's cart and wishlist saved to their account and
// in step across devices. Guests are untouched (local-only, as before).
export function useAccountSync(customerId: string | null) {
  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    const controller = new AbortController();
    let cartTimer: ReturnType<typeof setTimeout> | undefined;
    let wishlistTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubs: (() => void)[] = [];

    const pushCart = () =>
      fetch("/api/account/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: useCartStore
            .getState()
            .items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        }),
        keepalive: true,
      }).catch(() => undefined);

    const pushWishlist = () =>
      fetch("/api/account/wishlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: useWishlistStore.getState().items.map((i) => i.productId) }),
        keepalive: true,
      }).catch(() => undefined);

    (async () => {
      await Promise.all([
        whenHydrated(useCartStore as unknown as HydratableStore),
        whenHydrated(useWishlistStore as unknown as HydratableStore),
      ]);
      const res = await fetch("/api/account/state", { cache: "no-store", signal: controller.signal }).catch(() => null);
      if (!res?.ok || cancelled) return;
      const saved = (await res.json().catch(() => null)) as { cart: CartItem[]; wishlist: WishlistItem[] } | null;
      if (!saved || cancelled) return;

      const firstSyncOnDevice = readSyncedAccount() !== customerId;
      if (firstSyncOnDevice) {
        const byKey = new Map(saved.cart.map((i) => [lineKey(i), i]));
        for (const local of useCartStore.getState().items) {
          const existing = byKey.get(lineKey(local));
          if (existing) {
            existing.quantity = Math.min(Math.max(existing.quantity, local.quantity), existing.maxStock || 99);
          } else {
            byKey.set(lineKey(local), local);
          }
        }
        const wishlist = new Map(saved.wishlist.map((i) => [i.productId, i]));
        for (const local of useWishlistStore.getState().items) if (!wishlist.has(local.productId)) wishlist.set(local.productId, local);
        useCartStore.setState({ items: Array.from(byKey.values()) });
        useWishlistStore.setState({ items: Array.from(wishlist.values()) });
        await Promise.all([pushCart(), pushWishlist()]);
        try {
          localStorage.setItem(SYNCED_ACCOUNT_KEY, customerId);
        } catch {
          /* storage unavailable */
        }
      } else {
        useCartStore.setState({ items: saved.cart });
        useWishlistStore.setState({ items: saved.wishlist });
      }
      if (cancelled) return;

      unsubs.push(
        useCartStore.subscribe((state, prev) => {
          if (state.items === prev.items) return;
          clearTimeout(cartTimer);
          cartTimer = setTimeout(pushCart, PUSH_DELAY_MS);
        }),
        useWishlistStore.subscribe((state, prev) => {
          if (state.items === prev.items) return;
          clearTimeout(wishlistTimer);
          wishlistTimer = setTimeout(pushWishlist, PUSH_DELAY_MS);
        })
      );
    })();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(cartTimer);
      clearTimeout(wishlistTimer);
      unsubs.forEach((u) => u());
    };
  }, [customerId]);
}
