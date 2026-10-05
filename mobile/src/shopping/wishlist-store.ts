import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SavedWishlistItem } from "@shared/api-types";
import { shoppingStorage } from "./storage";

// The wishlist, ported from the website's src/store/wishlist-store.ts. The
// item shape is the API's SavedWishlistItem.

export type WishlistItem = SavedWishlistItem;

type WishlistState = {
  items: WishlistItem[];
  // Returns true when the piece is now saved, false when it was removed.
  toggle: (item: WishlistItem) => boolean;
  remove: (productId: string) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        set((state) => ({
          items: exists ? state.items.filter((i) => i.productId !== item.productId) : [...state.items, item],
        }));
        return !exists;
      },
      remove: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
    }),
    {
      name: "dodana.wishlist",
      version: 1,
      storage: shoppingStorage,
      partialize: (state) => ({ items: state.items }),
      migrate: (persistedState, version) => {
        if (version === 1) return persistedState as WishlistState;
        if (version === 0 || version === -1) {
          const state = persistedState as { items?: WishlistItem[] };
          return { items: Array.isArray(state.items) ? state.items : [] } as WishlistState;
        }
        return { items: [] };
      },
    }
  )
);

export function useIsWishlisted(productId: string): boolean {
  return useWishlistStore((state) => state.items.some((i) => i.productId === productId));
}
