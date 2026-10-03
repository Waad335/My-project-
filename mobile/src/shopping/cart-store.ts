import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SavedCartItem } from "@shared/api-types";
import { shoppingStorage } from "./storage";

// The cart, ported from the website's src/store/cart-store.ts: one line per
// product + variant, quantities capped at the stock the line was added with
// (99 when stock isn't tracked). The line shape is the API's SavedCartItem,
// so lines move between the phone and the customer's account unchanged.

export type CartItem = SavedCartItem;

// The most of one line the website allows when stock isn't tracked.
export const MAX_LINE_QUANTITY = 99;

const lineLimit = (item: Pick<CartItem, "maxStock">) => item.maxStock || MAX_LINE_QUANTITY;

export const sameLine = (item: CartItem, productId: string, variantId: string | null) =>
  item.productId === productId && item.variantId === variantId;

type CartState = {
  items: CartItem[];
  // Returns how many pieces were actually added (0 when the line is already
  // at its limit), so the product screen can say so.
  addItem: (item: CartItem) => number;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => sameLine(i, item.productId, item.variantId));
        if (existing) {
          const nextQuantity = Math.min(existing.quantity + item.quantity, lineLimit(item));
          const added = Math.max(0, nextQuantity - existing.quantity);
          if (added > 0) {
            set((state) => ({
              items: state.items.map((i) => (sameLine(i, item.productId, item.variantId) ? { ...i, quantity: nextQuantity } : i)),
            }));
          }
          return added;
        }
        set((state) => ({ items: [...state.items, item] }));
        return item.quantity;
      },
      removeItem: (productId, variantId) =>
        set((state) => ({ items: state.items.filter((i) => !sameLine(i, productId, variantId)) })),
      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            sameLine(i, productId, variantId) ? { ...i, quantity: Math.max(1, Math.min(quantity, lineLimit(i))) } : i
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "dodana.cart", version: 1, storage: shoppingStorage, partialize: (state) => ({ items: state.items }) }
  )
);

export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
export const cartLineLimit = lineLimit;

// The number on the Cart and Wishlist tab icons ("99+" beyond that).
export function tabBadge(count: number): string | number | undefined {
  if (count <= 0) return undefined;
  return count > 99 ? "99+" : count;
}
