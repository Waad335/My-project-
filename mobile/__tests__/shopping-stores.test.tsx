import { readFileSync } from "fs";
import { join } from "path";
import { Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render, screen } from "@testing-library/react-native";
import { mergeCart, mergeWishlist, PUSH_DELAY_MS } from "@/shopping/account-sync";
import { cartCount, cartSubtotal, MAX_LINE_QUANTITY, tabBadge, useCartStore, type CartItem } from "@/shopping/cart-store";
import { useHydrated } from "@/shopping/storage";
import { useWishlistStore, type WishlistItem } from "@/shopping/wishlist-store";

const website = (path: string) => readFileSync(join(__dirname, "..", "..", path), "utf8");

const line = (overrides: Partial<CartItem> = {}): CartItem => ({
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

const saved = (overrides: Partial<WishlistItem> = {}): WishlistItem => ({
  productId: "p1",
  slug: "rose-serum",
  nameEn: "Rose Serum",
  nameAr: "سيروم الورد",
  image: null,
  price: 500,
  ...overrides,
});

beforeEach(async () => {
  await AsyncStorage.clear();
  useCartStore.setState({ items: [] });
  useWishlistStore.setState({ items: [] });
});

describe("cart (ported from the website's cart store)", () => {
  it("adds lines, merges the same product and variant, and caps at the stock", () => {
    const { addItem } = useCartStore.getState();
    expect(addItem(line({ quantity: 2, maxStock: 3 }))).toBe(2);
    expect(addItem(line({ quantity: 2, maxStock: 3 }))).toBe(1);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]?.quantity).toBe(3);
    // Already at the limit: nothing more is added, and the screen is told so.
    expect(addItem(line({ quantity: 1, maxStock: 3 }))).toBe(0);
    // Another variant of the same product is its own line.
    expect(addItem(line({ variantId: "v50", quantity: 1 }))).toBe(1);
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("allows up to 99 when the stock isn't tracked", () => {
    const { addItem } = useCartStore.getState();
    addItem(line({ maxStock: 0, quantity: 98 }));
    expect(addItem(line({ maxStock: 0, quantity: 5 }))).toBe(1);
    expect(useCartStore.getState().items[0]?.quantity).toBe(MAX_LINE_QUANTITY);
  });

  it("keeps quantities between 1 and the stock, removes lines and totals them", () => {
    const { addItem, updateQuantity, removeItem } = useCartStore.getState();
    addItem(line({ quantity: 2, unitPrice: 550, maxStock: 4 }));
    addItem(line({ productId: "p2", quantity: 1, unitPrice: 120 }));
    updateQuantity("p1", null, 0);
    expect(useCartStore.getState().items[0]?.quantity).toBe(1);
    updateQuantity("p1", null, 10);
    expect(useCartStore.getState().items[0]?.quantity).toBe(4);
    const items = useCartStore.getState().items;
    expect(cartCount(items)).toBe(5);
    expect(cartSubtotal(items)).toBe(4 * 550 + 120);
    removeItem("p1", null);
    expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(["p2"]);
  });

  it("is saved on the phone and loaded again", async () => {
    useCartStore.getState().addItem(line({ quantity: 2 }));
    await act(async () => undefined);
    const stored = JSON.parse((await AsyncStorage.getItem("dodana.cart")) ?? "{}");
    expect(stored.state).toEqual({ items: [line({ quantity: 2 })] });

    useCartStore.setState({ items: [] }, false);
    await AsyncStorage.setItem("dodana.cart", JSON.stringify({ state: { items: [line({ quantity: 3 })] }, version: 1 }));
    await act(() => useCartStore.persist.rehydrate());
    expect(useCartStore.getState().items).toEqual([line({ quantity: 3 })]);
  });

  it("shows the count on the tab icons, up to 99+", () => {
    expect(tabBadge(0)).toBeUndefined();
    expect(tabBadge(7)).toBe(7);
    expect(tabBadge(150)).toBe("99+");
  });
});

describe("wishlist (ported from the website's wishlist store)", () => {
  it("toggles pieces on and off and saves them on the phone", async () => {
    const { toggle, remove } = useWishlistStore.getState();
    expect(toggle(saved())).toBe(true);
    expect(toggle(saved({ productId: "p2" }))).toBe(true);
    expect(toggle(saved())).toBe(false);
    expect(useWishlistStore.getState().items.map((i) => i.productId)).toEqual(["p2"]);
    remove("p2");
    expect(useWishlistStore.getState().items).toEqual([]);
    toggle(saved({ productId: "p3" }));
    await act(async () => undefined);
    const stored = JSON.parse((await AsyncStorage.getItem("dodana.wishlist")) ?? "{}");
    expect(stored.state.items.map((i: WishlistItem) => i.productId)).toEqual(["p3"]);
  });
});

describe("account sync rules (ported from the website)", () => {
  it("merges on the first sync: saved lines win, shared lines keep the larger quantity within stock", () => {
    const merged = mergeCart(
      [line({ quantity: 1, maxStock: 2 }), line({ productId: "saved-only" })],
      [line({ quantity: 4, maxStock: 9 }), line({ productId: "phone-only" })]
    );
    expect(merged.map((i) => [i.productId, i.quantity])).toEqual([
      ["p1", 2],
      ["saved-only", 1],
      ["phone-only", 1],
    ]);
    expect(mergeWishlist([saved({ productId: "a" })], [saved({ productId: "b" }), saved({ productId: "a" })]).map((i) => i.productId)).toEqual([
      "a",
      "b",
    ]);
  });

  it("uses the website's own limits, merge rule and save delay", () => {
    const cartStore = website("src/store/cart-store.ts");
    const sync = website("src/hooks/use-account-sync.ts");
    expect(cartStore).toContain("Math.min(existing.quantity + item.quantity, item.maxStock || 99)");
    expect(cartStore).toContain("Math.max(1, Math.min(quantity, i.maxStock || 99))");
    expect(sync).toContain("Math.min(Math.max(existing.quantity, local.quantity), existing.maxStock || 99)");
    expect(sync).toContain(`const PUSH_DELAY_MS = ${PUSH_DELAY_MS};`);
    expect(MAX_LINE_QUANTITY).toBe(99);
  });
});

describe("loading state", () => {
  it("reports when a store has finished loading from the phone", async () => {
    let finish: () => void = () => undefined;
    let done = false;
    const store = {
      persist: {
        hasHydrated: () => done,
        onFinishHydration: (fn: () => void) => {
          finish = () => {
            done = true;
            fn();
          };
          return () => undefined;
        },
      },
    };
    function Probe() {
      return <Text>{useHydrated(store) ? "ready" : "loading"}</Text>;
    }
    await render(<Probe />);
    expect(screen.getByText("loading")).toBeTruthy();
    await act(async () => finish());
    expect(screen.getByText("ready")).toBeTruthy();
  });
});
