import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/api";
import { useSessionStore } from "@/auth/session-store";
import { useCartStore, type CartItem } from "./cart-store";
import { whenHydrated } from "./storage";
import { useWishlistStore, type WishlistItem } from "./wishlist-store";

// Keeps a signed-in customer's cart and wishlist saved to their account, as
// the website's src/hooks/use-account-sync.ts does, through the existing
// /me/cart and /me/wishlist endpoints. Guests are untouched: their cart and
// wishlist stay on the phone.
//
// - The first sync of an account on this phone merges what's on the phone
//   with what's saved, then saves the result.
// - After that the saved copy wins (so a removal on another device sticks),
//   and every change on the phone is saved shortly afterwards.
// - Signing out clears the phone's copy; it stays saved in the account.

// Remembers which account this phone's cart and wishlist were last synced with.
export const SYNCED_ACCOUNT_KEY = "dodana.synced-account";
// The website waits this long after the last change before saving.
export const PUSH_DELAY_MS = 800;

const lineKey = (i: Pick<CartItem, "productId" | "variantId">) => `${i.productId}:${i.variantId ?? ""}`;

// The website's first-sync merge: saved lines win, a line on both keeps the
// larger quantity (within its stock), phone-only lines are added.
export function mergeCart(saved: CartItem[], local: CartItem[]): CartItem[] {
  const byKey = new Map(saved.map((i) => [lineKey(i), { ...i }]));
  for (const item of local) {
    const existing = byKey.get(lineKey(item));
    if (existing) existing.quantity = Math.min(Math.max(existing.quantity, item.quantity), existing.maxStock || 99);
    else byKey.set(lineKey(item), item);
  }
  return Array.from(byKey.values());
}

export function mergeWishlist(saved: WishlistItem[], local: WishlistItem[]): WishlistItem[] {
  const byId = new Map(saved.map((i) => [i.productId, i]));
  for (const item of local) if (!byId.has(item.productId)) byId.set(item.productId, item);
  return Array.from(byId.values());
}

// Saving failures are ignored, as on the website: the next change saves the
// whole cart again, and an expired session signs the app out (src/api).
const pushCart = () =>
  api
    .saveCart(useCartStore.getState().items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })))
    .catch(() => undefined);

const pushWishlist = () => api.saveWishlist(useWishlistStore.getState().items.map((i) => i.productId)).catch(() => undefined);

async function readSyncedAccount(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SYNCED_ACCOUNT_KEY);
  } catch {
    return null;
  }
}

export async function clearAccountSyncMarker(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNCED_ACCOUNT_KEY);
  } catch {
    /* storage unavailable */
  }
}

// Mounted once, at the root of the app.
export function useAccountSync(): void {
  const customerId = useSessionStore((s) => (s.status === "signedIn" ? (s.customer?.id ?? null) : null));
  const status = useSessionStore((s) => s.status);
  const previousCustomer = useRef<string | null>(null);

  // Signing out (or a session the server rejects) removes the account's
  // cart and wishlist from the phone, like the website's sign-out.
  useEffect(() => {
    if (previousCustomer.current && status === "guest") {
      useCartStore.getState().clear();
      useWishlistStore.setState({ items: [] });
      void clearAccountSyncMarker();
    }
    if (customerId) previousCustomer.current = customerId;
    else if (status === "guest") previousCustomer.current = null;
  }, [customerId, status]);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    let cartTimer: ReturnType<typeof setTimeout> | undefined;
    let wishlistTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribes: (() => void)[] = [];

    (async () => {
      await Promise.all([whenHydrated(useCartStore), whenHydrated(useWishlistStore)]);
      let saved: { cart: CartItem[]; wishlist: WishlistItem[] };
      try {
        const [cart, wishlist] = await Promise.all([api.getCart(), api.getWishlist()]);
        saved = { cart: cart.cart, wishlist: wishlist.wishlist };
      } catch {
        // Offline or the server is unreachable: keep the phone's copy; the
        // next sign-in or app start tries again.
        return;
      }
      if (cancelled) return;

      if ((await readSyncedAccount()) !== customerId) {
        useCartStore.setState({ items: mergeCart(saved.cart, useCartStore.getState().items) });
        useWishlistStore.setState({ items: mergeWishlist(saved.wishlist, useWishlistStore.getState().items) });
        await Promise.all([pushCart(), pushWishlist()]);
        try {
          await AsyncStorage.setItem(SYNCED_ACCOUNT_KEY, customerId);
        } catch {
          /* storage unavailable */
        }
      } else {
        useCartStore.setState({ items: saved.cart });
        useWishlistStore.setState({ items: saved.wishlist });
      }
      if (cancelled) return;

      unsubscribes.push(
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
      clearTimeout(cartTimer);
      clearTimeout(wishlistTimer);
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [customerId]);
}
