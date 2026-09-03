import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  variantId: string | null;
  slug: string;
  nameEn: string;
  nameAr: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  variantLabel: string | null;
  maxStock: number;
};

type AppliedPromo = { code: string; discountAmount: number } | null;

type CartState = {
  items: CartItem[];
  isDrawerOpen: boolean;
  appliedPromo: AppliedPromo;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clear: () => void;
  setPromo: (promo: AppliedPromo) => void;
  subtotal: () => number;
  count: () => number;
};

function sameLine(a: CartItem, productId: string, variantId: string | null) {
  return a.productId === productId && a.variantId === variantId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      appliedPromo: null,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => sameLine(i, item.productId, item.variantId));
          if (existing) {
            const nextQty = Math.min(existing.quantity + item.quantity, item.maxStock || 99);
            return {
              items: state.items.map((i) =>
                sameLine(i, item.productId, item.variantId) ? { ...i, quantity: nextQty } : i
              ),
              isDrawerOpen: true,
            };
          }
          return { items: [...state.items, item], isDrawerOpen: true };
        }),
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, productId, variantId)),
        })),
      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              sameLine(i, productId, variantId)
                ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock || 99)) }
                : i
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [], appliedPromo: null }),
      setPromo: (promo) => set({ appliedPromo: promo }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "dodana-cart" }
  )
);
