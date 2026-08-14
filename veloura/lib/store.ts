"use client";

import { create } from "zustand";
import type { ShopifyCart } from "@/types/shopify";
import {
  addToCartAction,
  getCartAction,
  removeCartLineAction,
  updateCartLineAction,
} from "@/lib/shopify/actions";

interface UiState {
  isCartOpen: boolean;
  isMobileMenuOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleMobileMenu: (value?: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isCartOpen: false,
  isMobileMenuOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleMobileMenu: (value) =>
    set((state) => ({ isMobileMenuOpen: value ?? !state.isMobileMenuOpen })),
}));

interface ShopTransitionState {
  /** True while a /shop filter/sort/search navigation is in flight — lets the
   * results grid (a sibling of the filters sidebar) show a skeleton without
   * both components needing to share a parent Client Component. */
  isPending: boolean;
  setPending: (value: boolean) => void;
}

export const useShopTransitionStore = create<ShopTransitionState>((set) => ({
  isPending: false,
  setPending: (value) => set({ isPending: value }),
}));

interface CartState {
  cart: ShopifyCart | null;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  isHydrated: false,
  hydrate: async () => {
    if (get().isHydrated) return;
    try {
      const cart = await getCartAction();
      set({ cart, isHydrated: true });
    } catch (error) {
      console.error("[cart] Failed to load existing cart", error);
      set({ cart: null, isHydrated: true });
    }
  },
  addItem: async (variantId, quantity = 1) => {
    set({ isLoading: true });
    try {
      const cart = await addToCartAction(variantId, quantity);
      set({ cart, isHydrated: true });
      useUiStore.getState().openCart();
    } finally {
      set({ isLoading: false });
    }
  },
  updateItem: async (lineId, quantity) => {
    set({ isLoading: true });
    try {
      const cart = await updateCartLineAction(lineId, quantity);
      set({ cart });
    } finally {
      set({ isLoading: false });
    }
  },
  removeItem: async (lineId) => {
    set({ isLoading: true });
    try {
      const cart = await removeCartLineAction(lineId);
      set({ cart });
    } finally {
      set({ isLoading: false });
    }
  },
}));
