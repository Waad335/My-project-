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
// - Signing in merges what's on the phone with what's saved in the account,
//   then saves the result, so nothing added as a guest is lost.
// - While signed in, the saved copy is loaded at start-up and every change
//   on the phone is saved shortly afterwards.
// - If a save fails (offline), that's remembered: the next sync merges
//   instead of letting the account's copy replace the phone's.
// - Signing out (signOutCustomer) saves any pending change first and only
//   then clears the phone's copy; if that save fails, the items stay on the
//   phone. An expired session also leaves them on the phone. Either way
//   they're merged into the account at the next sign-in.

// Remembers which account this phone's cart and wishlist were last synced with.
export const SYNCED_ACCOUNT_KEY = "dodana.synced-account";
// Set while the phone has changes the account hasn't received yet.
export const SYNC_PENDING_KEY = "dodana.sync-pending";
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

async function storageGet(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: string | null): Promise<void> {
  try {
    if (value === null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export const clearAccountSyncMarker = () => storageSet(SYNCED_ACCOUNT_KEY, null);

// The running sync, if any. `ready` once the account's copy has been loaded
// and merged: before that the phone must never overwrite the account.
const sync = {
  customerId: null as string | null,
  ready: false,
  cartTimer: undefined as ReturnType<typeof setTimeout> | undefined,
  wishlistTimer: undefined as ReturnType<typeof setTimeout> | undefined,
  // Changes made on the phone that the account hasn't confirmed yet.
  dirty: { cart: false, wishlist: false },
  unsubscribes: [] as (() => void)[],
};

function stopSync(): void {
  clearTimeout(sync.cartTimer);
  clearTimeout(sync.wishlistTimer);
  sync.unsubscribes.forEach((unsubscribe) => unsubscribe());
  sync.unsubscribes = [];
  sync.customerId = null;
  sync.ready = false;
  sync.dirty = { cart: false, wishlist: false };
}

async function pushCart(): Promise<boolean> {
  try {
    await api.saveCart(
      useCartStore.getState().items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }))
    );
    return true;
  } catch {
    return false;
  }
}

async function pushWishlist(): Promise<boolean> {
  try {
    await api.saveWishlist(useWishlistStore.getState().items.map((i) => i.productId));
    return true;
  } catch {
    return false;
  }
}

// The pending mark is set the moment something changes and cleared only once
// the account has both the cart and the wishlist, so even closing the app
// mid-save can't let the account's older copy overwrite the phone's.
async function markClean(kind: "cart" | "wishlist"): Promise<void> {
  sync.dirty[kind] = false;
  if (!sync.dirty.cart && !sync.dirty.wishlist) await storageSet(SYNC_PENDING_KEY, null);
}

// Saves both and records whether the account is now up to date.
async function pushAll(customerId: string): Promise<boolean> {
  sync.dirty = { cart: true, wishlist: true };
  await storageSet(SYNC_PENDING_KEY, customerId);
  const [cartSaved, wishlistSaved] = await Promise.all([pushCart(), pushWishlist()]);
  if (cartSaved) await markClean("cart");
  if (wishlistSaved) await markClean("wishlist");
  return cartSaved && wishlistSaved;
}

function schedule(kind: "cart" | "wishlist", customerId: string): void {
  sync.dirty[kind] = true;
  void storageSet(SYNC_PENDING_KEY, customerId);
  const timerKey = kind === "cart" ? "cartTimer" : "wishlistTimer";
  clearTimeout(sync[timerKey]);
  sync[timerKey] = setTimeout(async () => {
    if (await (kind === "cart" ? pushCart() : pushWishlist())) await markClean(kind);
  }, PUSH_DELAY_MS);
}

// Saves any pending change to the account right away. Resolves to true when
// the account now holds exactly what's on the phone.
export async function flushAccountSync(): Promise<boolean> {
  const customerId = sync.customerId;
  if (!customerId || !sync.ready) return false;
  clearTimeout(sync.cartTimer);
  clearTimeout(sync.wishlistTimer);
  return pushAll(customerId);
}

// Starts syncing a signed-in customer's cart and wishlist. Returns a stop function.
export function startAccountSync(customerId: string): () => void {
  stopSync();
  sync.customerId = customerId;
  let cancelled = false;

  (async () => {
    await Promise.all([whenHydrated(useCartStore), whenHydrated(useWishlistStore)]);
    let saved: { cart: CartItem[]; wishlist: WishlistItem[] };
    try {
      const [cart, wishlist] = await Promise.all([api.getCart(), api.getWishlist()]);
      saved = { cart: cart.cart, wishlist: wishlist.wishlist };
    } catch {
      // Offline or unreachable: keep the phone's copy and don't save over the
      // account; the next sign-in or app start tries again.
      return;
    }
    if (cancelled) return;

    const [marker, pending] = await Promise.all([storageGet(SYNCED_ACCOUNT_KEY), storageGet(SYNC_PENDING_KEY)]);
    if (cancelled) return;
    const merge = marker !== customerId || pending !== null;
    if (merge) {
      useCartStore.setState({ items: mergeCart(saved.cart, useCartStore.getState().items) });
      useWishlistStore.setState({ items: mergeWishlist(saved.wishlist, useWishlistStore.getState().items) });
    } else {
      useCartStore.setState({ items: saved.cart });
      useWishlistStore.setState({ items: saved.wishlist });
    }
    sync.ready = true;
    if (merge) {
      await pushAll(customerId);
      await storageSet(SYNCED_ACCOUNT_KEY, customerId);
    }
    if (cancelled) return;

    sync.unsubscribes.push(
      useCartStore.subscribe((state, prev) => {
        if (state.items !== prev.items) schedule("cart", customerId);
      }),
      useWishlistStore.subscribe((state, prev) => {
        if (state.items !== prev.items) schedule("wishlist", customerId);
      })
    );
  })();

  return () => {
    cancelled = true;
    if (sync.customerId === customerId) stopSync();
  };
}

// Signs the customer out without losing anything: pending changes are saved
// to the account first; only when that worked is the phone's copy cleared
// (like the website's sign-out). Otherwise the items stay on the phone and
// are merged into the account at the next sign-in.
export async function signOutCustomer(): Promise<{ keptOnPhone: boolean }> {
  const saved = await flushAccountSync();
  stopSync();
  await useSessionStore.getState().signOut("signedOut");
  await clearAccountSyncMarker();
  if (saved) {
    useCartStore.getState().clear();
    useWishlistStore.setState({ items: [] });
    return { keptOnPhone: false };
  }
  const hasItems = useCartStore.getState().items.length > 0 || useWishlistStore.getState().items.length > 0;
  return { keptOnPhone: hasItems };
}

// Mounted once, at the root of the app.
export function useAccountSync(): void {
  const customerId = useSessionStore((s) => (s.status === "signedIn" ? (s.customer?.id ?? null) : null));
  const status = useSessionStore((s) => s.status);
  const wasSignedIn = useRef(false);

  // When a session ends (sign-out or expiry) the next sign-in merges, so
  // nothing on the phone is overwritten.
  useEffect(() => {
    if (status === "signedIn") wasSignedIn.current = true;
    else if (status === "guest" && wasSignedIn.current) {
      wasSignedIn.current = false;
      void clearAccountSyncMarker();
    }
  }, [status]);

  useEffect(() => {
    if (!customerId) return;
    return startAccountSync(customerId);
  }, [customerId]);
}
