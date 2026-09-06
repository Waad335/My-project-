import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishlistItem = {
  productId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  image: string | null;
  price: number;
};

type WishlistState = {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  count: () => number;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.productId === item.productId);
          return {
            items: exists ? state.items.filter((i) => i.productId !== item.productId) : [...state.items, item],
          };
        }),
      remove: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      has: (productId) => get().items.some((i) => i.productId === productId),
      count: () => get().items.length,
    }),
    {
      name: "dodana-wishlist",
      // Same rationale as cart-store: avoid rehydrating from localStorage
      // during the first client render, which would otherwise mismatch the
      // server-rendered (wishlist-less) HTML. AppProviders rehydrates once
      // after mount.
      skipHydration: true,
    }
  )
);
