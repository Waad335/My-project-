import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCartStore, type CartItem } from "@/shopping/cart-store";
import { useWishlistStore, type WishlistItem } from "@/shopping/wishlist-store";

const cartLine = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: "p1",
  variantId: null,
  slug: "rose-serum",
  nameEn: "Rose Serum",
  nameAr: "سيروم الورد",
  image: null,
  unitPrice: 500,
  quantity: 1,
  variantLabel: null,
  maxStock: 5,
  ...overrides,
});

const wishlistItem = (overrides: Partial<WishlistItem> = {}): WishlistItem => ({
  productId: "p1",
  slug: "rose-serum",
  nameEn: "Rose Serum",
  nameAr: "سيروم الورد",
  image: null,
  price: 500,
  ...overrides,
});

describe("Shopping stores migration", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useCartStore.setState({ items: [] });
    useWishlistStore.setState({ items: [] });
  });

  it("migrates cart from version -1 (no version) to version 1", async () => {
    const item = cartLine();
    // Simulate old stored data without version field
    await AsyncStorage.setItem("dodana.cart", JSON.stringify({ state: { items: [item] } }));

    // Rehydrate should trigger migration
    await useCartStore.persist.rehydrate();

    // Should have loaded the item despite version mismatch
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.productId).toBe("p1");
  });

  it("migrates cart from explicitly versioned 0 to version 1", async () => {
    const item = cartLine();
    await AsyncStorage.setItem("dodana.cart", JSON.stringify({ state: { items: [item] }, version: 0 }));

    await useCartStore.persist.rehydrate();

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.productId).toBe("p1");
  });

  it("handles malformed cart data gracefully", async () => {
    // Store corrupt data with version 0 to trigger migration
    await AsyncStorage.setItem("dodana.cart", JSON.stringify({ state: { items: null }, version: 0 }));

    await useCartStore.persist.rehydrate();

    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
  });

  it("migrates wishlist from version -1 (no version) to version 1", async () => {
    const item = wishlistItem();
    await AsyncStorage.setItem("dodana.wishlist", JSON.stringify({ state: { items: [item] } }));

    await useWishlistStore.persist.rehydrate();

    const state = useWishlistStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.productId).toBe("p1");
  });

  it("migrates wishlist from version 0 to version 1", async () => {
    const item = wishlistItem();
    await AsyncStorage.setItem("dodana.wishlist", JSON.stringify({ state: { items: [item] }, version: 0 }));

    await useWishlistStore.persist.rehydrate();

    const state = useWishlistStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.productId).toBe("p1");
  });

  it("handles malformed wishlist data gracefully", async () => {
    await AsyncStorage.setItem("dodana.wishlist", JSON.stringify({ state: { items: undefined } }));

    await useWishlistStore.persist.rehydrate();

    const state = useWishlistStore.getState();
    expect(state.items).toEqual([]);
  });

  it("preserves version 1 data as-is", async () => {
    const item = cartLine({ quantity: 5 });
    await AsyncStorage.setItem("dodana.cart", JSON.stringify({ state: { items: [item] }, version: 1 }));

    await useCartStore.persist.rehydrate();

    const state = useCartStore.getState();
    expect(state.items[0]?.quantity).toBe(5);
  });
});
