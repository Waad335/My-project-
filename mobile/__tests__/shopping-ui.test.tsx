import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductCard } from "@/components/catalog/ProductCard";
import { I18nProvider } from "@/i18n/I18nProvider";
import { useLocaleStore } from "@/i18n/locale-store";
import type { Locale } from "@/i18n/config";
import CartScreen from "@/app/(tabs)/cart";
import WishlistScreen from "@/app/(tabs)/wishlist";
import ProductScreen from "@/app/product/[slug]";
import { useCartStore, type CartItem } from "@/shopping/cart-store";
import { useWishlistStore } from "@/shopping/wishlist-store";
import { card, detail, settings, variant } from "./helpers/catalog-fixtures";

const mockRouter = { push: jest.fn(), navigate: jest.fn(), setParams: jest.fn(), dismissTo: jest.fn(), back: jest.fn() };
let mockParams: Record<string, string | undefined> = {};
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  Stack: { Screen: () => null },
}));

const mockApi = { getProduct: jest.fn(), getSettings: jest.fn() };
jest.mock("@/api", () => ({
  get api() {
    return mockApi;
  },
}));

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

async function renderIn(locale: Locale, ui: ReactNode) {
  useLocaleStore.setState({ locale, hydrated: true });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>
        <I18nProvider>{ui}</I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const perfume = detail({
  id: "yara",
  slug: "yara",
  nameEn: "Yara Eau de Parfum",
  nameAr: "عطر يارا",
  image: "https://example.test/yara.jpg",
  effectivePrice: 550,
  variants: [
    variant({ id: "v20", sku: "DOD-20", size: "20ml", stock: 2, isDefault: true }),
    variant({ id: "v50", sku: "DOD-50", size: "50ml", priceDelta: 250, stock: 0 }),
  ],
});

const cartLine = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: "yara",
  variantId: "v20",
  slug: "yara",
  nameEn: "Yara Eau de Parfum",
  nameAr: "عطر يارا",
  image: null,
  unitPrice: 550,
  quantity: 1,
  variantLabel: "20ml",
  maxStock: 3,
  ...overrides,
});

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = {};
  await AsyncStorage.clear();
  useCartStore.setState({ items: [] });
  useWishlistStore.setState({ items: [] });
  mockApi.getSettings.mockResolvedValue(settings());
});

describe("add to cart on the product screen", () => {
  beforeEach(() => {
    mockParams = { slug: "yara" };
    mockApi.getProduct.mockResolvedValue({ product: perfume, related: [] });
  });

  it("adds the chosen size and quantity, confirms it and links to the cart", async () => {
    await renderIn("en", <ProductScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "Increase quantity" }));
    // The 20ml size has 2 in stock: the stepper stops there.
    expect(screen.getByRole("button", { name: "Increase quantity" }).props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(screen.getByRole("button", { name: "Add to Cart" }));

    expect(useCartStore.getState().items).toEqual([
      {
        productId: "yara",
        variantId: "v20",
        slug: "yara",
        nameEn: "Yara Eau de Parfum",
        nameAr: "عطر يارا",
        image: "https://example.test/yara.jpg",
        unitPrice: 550,
        quantity: 2,
        variantLabel: "20ml",
        maxStock: 2,
      },
    ]);
    expect(screen.getByText("Added to cart")).toBeTruthy();
    await fireEvent.press(screen.getByRole("link", { name: "View full cart" }));
    expect(mockRouter.navigate).toHaveBeenCalledWith("/cart");
  });

  it("says so when the cart already holds all the available pieces", async () => {
    useCartStore.setState({ items: [cartLine({ quantity: 2, maxStock: 2 })] });
    await renderIn("en", <ProductScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "Add to Cart" }));
    expect(screen.getByText("You already have all the available pieces of this item in your cart.")).toBeTruthy();
    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
  });

  it("can't add a size that is out of stock", async () => {
    await renderIn("en", <ProductScreen />);
    await fireEvent.press(await screen.findByRole("radio", { name: "50ml" }));
    const button = screen.getByRole("button", { name: "Out of Stock" });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(button);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("lets a made-to-order product be added up to 99", async () => {
    mockApi.getProduct.mockResolvedValue({ product: detail({ id: "mto", slug: "mto", trackStock: false, stock: 0 }), related: [] });
    await renderIn("en", <ProductScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "Add to Cart" }));
    expect(useCartStore.getState().items[0]).toMatchObject({ productId: "mto", quantity: 1, maxStock: 99 });
  });

  it("saves the product to the wishlist from its heart, in Arabic too", async () => {
    await renderIn("ar", <ProductScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "أضيفي للمفضلة" }));
    expect(useWishlistStore.getState().items).toEqual([
      { productId: "yara", slug: "yara", nameEn: "Yara Eau de Parfum", nameAr: "عطر يارا", image: "https://example.test/yara.jpg", price: 550 },
    ]);
    expect(screen.getByRole("button", { name: "إزالة من المفضلة" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "أضيفي للسلة" })).toBeTruthy();
  });
});

describe("wishlist heart on product cards", () => {
  it("saves and removes the piece without opening the product", async () => {
    await renderIn("en", <ProductCard product={card({ effectivePrice: 620 })} width={160} />);
    await fireEvent.press(screen.getByRole("button", { name: "Add to wishlist" }));
    expect(useWishlistStore.getState().items.map((i) => [i.productId, i.price])).toEqual([["p1", 620]]);
    expect(mockRouter.push).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Remove from wishlist" }));
    expect(useWishlistStore.getState().items).toEqual([]);
    // The card itself still opens the product.
    await fireEvent.press(screen.getByRole("link", { name: "Rose Serum, EGP 620" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/product/[slug]", params: { slug: "rose-serum" } });
  });
});

describe("cart screen", () => {
  it("lists each piece with its price, changes quantities, totals and removes", async () => {
    useCartStore.setState({ items: [cartLine({ quantity: 1, maxStock: 2 }), cartLine({ productId: "musk", slug: "musk", nameEn: "Musk Oil", variantId: null, variantLabel: null, unitPrice: 120 })] });
    await renderIn("en", <CartScreen />);
    expect(await screen.findByText("Yara Eau de Parfum")).toBeTruthy();
    expect(screen.getByText("20ml")).toBeTruthy();
    expect(screen.getByText("EGP 550 each")).toBeTruthy();
    expect(screen.getByText("2 items")).toBeTruthy();
    expect(screen.getAllByText("EGP 670")).toHaveLength(2); // subtotal and total

    const increases = screen.getAllByRole("button", { name: "Increase quantity" });
    await fireEvent.press(increases[0]!);
    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
    expect(screen.getAllByText("EGP 1,220")).toHaveLength(2);
    // At the stock limit the + button is disabled.
    expect(screen.getAllByRole("button", { name: "Increase quantity" })[0]!.props.accessibilityState).toMatchObject({ disabled: true });

    await fireEvent.press(screen.getByRole("button", { name: "Remove: Musk Oil" }));
    expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(["yara"]);
    expect(screen.getByText("Shipping")).toBeTruthy();
    expect(screen.getByText("Calculated at checkout")).toBeTruthy();
  });

  it("shows the empty cart and leads back to the shop", async () => {
    await renderIn("ar", <CartScreen />);
    expect(await screen.findByText("سلتك فارغة.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "أكملي التسوق" }));
    expect(mockRouter.navigate).toHaveBeenCalledWith("/shop");
  });

  it("shows prices in Arabic", async () => {
    useCartStore.setState({ items: [cartLine({ quantity: 2 })] });
    await renderIn("ar", <CartScreen />);
    expect(await screen.findByText("عطر يارا")).toBeTruthy();
    expect(screen.getAllByText("١٬١٠٠ ج.م").length).toBeGreaterThan(0);
  });
});

describe("wishlist screen", () => {
  it("lists saved pieces, opens them and removes them", async () => {
    useWishlistStore.setState({
      items: [
        { productId: "yara", slug: "yara", nameEn: "Yara Eau de Parfum", nameAr: "عطر يارا", image: null, price: 550 },
        { productId: "musk", slug: "musk", nameEn: "Musk Oil", nameAr: "زيت المسك", image: null, price: 120 },
      ],
    });
    await renderIn("en", <WishlistScreen />);
    await fireEvent.press(await screen.findByRole("link", { name: "Yara Eau de Parfum, EGP 550" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/product/[slug]", params: { slug: "yara" } });
    await fireEvent.press(screen.getByRole("button", { name: "Remove: Musk Oil" }));
    expect(useWishlistStore.getState().items.map((i) => i.productId)).toEqual(["yara"]);
  });

  it("explains the empty wishlist", async () => {
    await renderIn("en", <WishlistScreen />);
    expect(await screen.findByText("Your wishlist is empty.")).toBeTruthy();
    expect(screen.getByText("Tap the heart on anything you love to save it here.")).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("button", { name: "Continue Shopping" })).toBeTruthy());
  });
});
