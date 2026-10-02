import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { HomeResponse, ProductListResponse } from "@shared/api-types";
import { ApiError } from "@/api/errors";
import { FilterSheet } from "@/components/catalog/FilterSheet";
import { ProductBrowser } from "@/components/catalog/ProductBrowser";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SearchSuggestions } from "@/components/catalog/SearchSuggestions";
import { I18nProvider } from "@/i18n/I18nProvider";
import { useLocaleStore } from "@/i18n/locale-store";
import type { Locale } from "@/i18n/config";
import HomeScreen from "@/app/(tabs)/index";
import ShopScreen from "@/app/(tabs)/shop";
import ProductScreen from "@/app/product/[slug]";
import { card, detail, settings, variant } from "./helpers/catalog-fixtures";

// Router and API are replaced; everything else (i18n, query cache, rules,
// components) is the real app code.
const mockRouter = { push: jest.fn(), navigate: jest.fn(), setParams: jest.fn(), dismissTo: jest.fn(), back: jest.fn() };
let mockParams: Record<string, string | undefined> = {};
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  Stack: { Screen: () => null },
}));

const mockApi = {
  getHome: jest.fn(),
  getCategories: jest.fn(),
  getCategory: jest.fn(),
  getProduct: jest.fn(),
  getSettings: jest.fn(),
  listProducts: jest.fn(),
  searchSuggest: jest.fn(),
};
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

const page = (products: ProductListResponse["products"], total = products.length): ProductListResponse => ({
  products,
  total,
  page: 1,
  pageSize: 20,
  pageCount: Math.max(1, Math.ceil(total / 20)),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockApi.getSettings.mockResolvedValue(settings());
  mockApi.getCategories.mockResolvedValue({ shopCategories: [], departments: [] });
});

describe("product card", () => {
  it("shows the sale badge, price and low-stock note, and opens the product", async () => {
    await renderIn("en", <ProductCard product={card({ oldPrice: 750, effectivePrice: 620, stock: 3 })} width={160} />);
    expect(screen.getByText("-17%")).toBeTruthy();
    expect(screen.getByText("EGP 620")).toBeTruthy();
    expect(screen.getByText("Only 3 left")).toBeTruthy();
    await fireEvent.press(screen.getByRole("link", { name: "Rose Serum, EGP 620" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/product/[slug]", params: { slug: "rose-serum" } });
  });

  it("speaks Arabic and says when a piece is out of stock", async () => {
    await renderIn("ar", <ProductCard product={card({ stock: 0 })} width={160} />);
    expect(screen.getByText("سيروم الورد")).toBeTruthy();
    expect(screen.getByRole("link", { name: /سيروم الورد، .*|سيروم الورد, .*/ })).toBeTruthy();
    expect(screen.queryByText(/Only/)).toBeNull();
  });
});

describe("filter sheet", () => {
  it("refuses a minimum above the maximum, then applies valid filters", async () => {
    const onApply = jest.fn();
    await renderIn("en", <FilterSheet visible filters={{ sort: "featured" }} defaultSort="featured" onApply={onApply} onClose={() => undefined} />);
    await fireEvent.changeText(screen.getByLabelText("Min"), "900");
    await fireEvent.changeText(screen.getByLabelText("Max"), "300");
    await fireEvent.press(screen.getByRole("button", { name: "Show results" }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByText("The minimum price can’t be higher than the maximum.")).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText("Max"), "1,200");
    await fireEvent.press(screen.getByRole("radio", { name: "Price: Low to High" }));
    await fireEvent.press(screen.getByRole("button", { name: "Show results" }));
    expect(onApply).toHaveBeenCalledWith({ sort: "price-asc", minPrice: 900, maxPrice: 1200 });
  });

  it("clears back to the screen's defaults", async () => {
    const onApply = jest.fn();
    await renderIn(
      "en",
      <FilterSheet visible filters={{ sort: "price-desc", minPrice: 100 }} defaultSort="newest" onApply={onApply} onClose={() => undefined} />
    );
    await fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));
    await fireEvent.press(screen.getByRole("button", { name: "Show results" }));
    expect(onApply).toHaveBeenCalledWith({ sort: "newest", minPrice: undefined, maxPrice: undefined });
  });
});

describe("product browser", () => {
  const browser = (props: Partial<Parameters<typeof ProductBrowser>[0]> = {}) => (
    <ProductBrowser
      scope={{ category: "skincare" }}
      filters={{ sort: "newest" }}
      defaultSort="newest"
      onFiltersChange={() => undefined}
      narrowed={false}
      onClearAll={() => undefined}
      {...props}
    />
  );

  it("lists products 20 at a time with the chosen filters", async () => {
    mockApi.listProducts.mockResolvedValue(page([card(), card({ id: "p2", slug: "b", nameEn: "Body Oil" })]));
    await renderIn("en", browser({ filters: { sort: "price-asc", minPrice: 100 } }));
    expect(await screen.findByText("2 products")).toBeTruthy();
    expect(screen.getByText("Body Oil")).toBeTruthy();
    expect(mockApi.listProducts).toHaveBeenCalledWith({ category: "skincare", sort: "price-asc", minPrice: 100, pageSize: 20, page: 1 });
    expect(screen.getByRole("button", { name: "Filter (2)" })).toBeTruthy();
  });

  it("offers to clear filters when nothing matches", async () => {
    const onClearAll = jest.fn();
    mockApi.listProducts.mockResolvedValue(page([]));
    await renderIn("en", browser({ narrowed: true, onClearAll }));
    expect(await screen.findByText("Nothing matches just yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearAll).toHaveBeenCalled();
  });

  it("explains a failed load and retries", async () => {
    mockApi.listProducts.mockRejectedValueOnce(new ApiError({ status: 0, code: "network" }));
    mockApi.listProducts.mockResolvedValueOnce(page([card()]));
    await renderIn("en", browser());
    expect(await screen.findByText("We couldn't connect. Check your internet connection and try again.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Rose Serum")).toBeTruthy();
  });
});

describe("search suggestions", () => {
  it("waits for two characters, then suggests products and 'see all'", async () => {
    const onSeeAll = jest.fn();
    await renderIn("en", <SearchSuggestions query="r" onSeeAll={onSeeAll} />);
    expect(screen.getByText("Start typing to search DODANA.")).toBeTruthy();
    expect(mockApi.searchSuggest).not.toHaveBeenCalled();
    await screen.unmount();

    mockApi.searchSuggest.mockResolvedValue({ products: [card()] });
    await renderIn("en", <SearchSuggestions query="rose" onSeeAll={onSeeAll} />);
    expect(await screen.findByText("Rose Serum")).toBeTruthy();
    expect(mockApi.searchSuggest).toHaveBeenCalledWith("rose");
    await fireEvent.press(screen.getByRole("button", { name: "See all results for “rose”" }));
    expect(onSeeAll).toHaveBeenCalled();
  });
});

describe("home screen", () => {
  const home = (overrides: Partial<HomeResponse> = {}): HomeResponse => ({
    showcase: [],
    shopCategories: [
      { id: "c1", slug: "skincare", nameEn: "Skincare", nameAr: "العناية بالبشرة", descriptionEn: null, descriptionAr: null, image: null, productCount: 1 },
      { id: "c2", slug: "bags", nameEn: "Bags", nameAr: "شنط", descriptionEn: null, descriptionAr: null, image: null, productCount: 0 },
    ],
    departments: [],
    featured: [],
    newArrivals: [],
    bestSellers: [],
    ...overrides,
  });

  it("shows 'coming soon' instead of empty product rows while the catalogue is empty", async () => {
    mockApi.getHome.mockResolvedValue(home());
    mockApi.getSettings.mockResolvedValue(settings({ announcementEn: "Free delivery this week" }));
    await renderIn("en", <HomeScreen />);
    expect(await screen.findByText("New arrivals, coming soon")).toBeTruthy();
    expect(screen.getByText("Shop by Category")).toBeTruthy();
    expect(await screen.findByText("Free delivery this week")).toBeTruthy();
    expect(screen.queryByText("Featured Products")).toBeNull();
  });

  it("filters new arrivals by category, like the website", async () => {
    mockApi.getHome.mockResolvedValue(
      home({ featured: [card({ id: "f1", nameEn: "Featured Serum" })], newArrivals: [card({ id: "n1", nameEn: "New Serum" })] })
    );
    await renderIn("en", <HomeScreen />);
    expect(await screen.findByText("New Serum")).toBeTruthy();
    expect(screen.getByText("Featured Serum")).toBeTruthy();
    await fireEvent.press(screen.getByRole("tab", { name: "Bags" }));
    expect(screen.getByText("New pieces are on the way")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Browse Bags" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/category/[slug]", params: { slug: "bags" } });
  });
});

describe("shop screen", () => {
  it("searches when submitted and narrows by category", async () => {
    mockApi.getCategories.mockResolvedValue({
      shopCategories: [{ id: "c1", slug: "skincare", nameEn: "Skincare", nameAr: "العناية بالبشرة", descriptionEn: null, descriptionAr: null, image: null, productCount: 1 }],
      departments: [],
    });
    mockApi.listProducts.mockResolvedValue(page([card()]));
    await renderIn("en", <ShopScreen />);
    expect(await screen.findByText("1 product")).toBeTruthy();
    expect(mockApi.listProducts).toHaveBeenLastCalledWith({ sort: "featured", pageSize: 20, page: 1 });

    const search = screen.getByLabelText("Search products");
    await fireEvent.changeText(search, "rose");
    await fireEvent(search, "submitEditing");
    await waitFor(() => expect(mockApi.listProducts).toHaveBeenLastCalledWith({ q: "rose", sort: "featured", pageSize: 20, page: 1 }));

    await fireEvent.press(await screen.findByRole("radio", { name: "Skincare" }));
    await waitFor(() =>
      expect(mockApi.listProducts).toHaveBeenLastCalledWith({ q: "rose", category: "skincare", sort: "featured", pageSize: 20, page: 1 })
    );
  });
});

describe("product screen", () => {
  const perfume = detail({
    nameEn: "Yara Eau de Parfum",
    effectivePrice: 550,
    oldPrice: 650,
    ratingAvg: 4.5,
    ratingCount: 2,
    variants: [
      variant({ id: "v20", sku: "DOD-20", size: "20ml", stock: 3, isDefault: true }),
      variant({ id: "v50", sku: "DOD-50", size: "50ml", priceDelta: 250, stock: 0 }),
    ],
    reviews: [{ id: "r1", authorName: "Nour", rating: 5, comment: "Lovely.", isDemo: true, createdAt: "2026-09-01T00:00:00.000Z" }],
  });

  it("shows price and stock for the chosen size, notes and reviews", async () => {
    mockParams = { slug: "yara" };
    mockApi.getProduct.mockResolvedValue({ product: perfume, related: [card({ id: "r2", nameEn: "Musk Oil" })] });
    await renderIn("en", <ProductScreen />);
    expect(await screen.findByRole("header", { name: "Yara Eau de Parfum" })).toBeTruthy();
    expect(mockApi.getProduct).toHaveBeenCalledWith("yara");
    expect(screen.getByText("EGP 550")).toBeTruthy();
    expect(screen.getByText("Only 3 left")).toBeTruthy();
    expect(screen.getByText("SKU: DOD-20")).toBeTruthy();

    await fireEvent.press(screen.getByRole("radio", { name: "50ml" }));
    expect(screen.getByText("EGP 800")).toBeTruthy();
    expect(screen.getAllByText("Out of Stock").length).toBeGreaterThan(0);
    expect(screen.getByText("SKU: DOD-50")).toBeTruthy();

    expect(await screen.findByText("Pay cash on delivery.")).toBeTruthy();
    expect(screen.getByText("Demo review — for preview only")).toBeTruthy();
    expect(screen.getByText("Musk Oil")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "View policy" }));
    expect(screen.getByText("Returns within 14 days.")).toBeTruthy();
  });

  it("doesn't promise cash on delivery when the store has it switched off", async () => {
    mockParams = { slug: "yara" };
    mockApi.getProduct.mockResolvedValue({ product: perfume, related: [] });
    mockApi.getSettings.mockResolvedValue(settings({ paymentMethods: [] }));
    await renderIn("en", <ProductScreen />);
    // "View policy" appears once the store settings have loaded.
    expect(await screen.findByRole("button", { name: "View policy" })).toBeTruthy();
    expect(screen.queryByText("Pay cash on delivery.")).toBeNull();
  });

  it("opens photos full screen and steps through them", async () => {
    mockParams = { slug: "yara" };
    const images = ["a", "b", "c"].map((name) => ({ url: `https://example.test/${name}.jpg`, altEn: null, altAr: null }));
    mockApi.getProduct.mockResolvedValue({ product: { ...perfume, images }, related: [] });
    await renderIn("en", <ProductScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "Open full-screen image viewer" }));
    expect(screen.getAllByText("1 of 3").length).toBe(2); // gallery and viewer
    await fireEvent.press(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByText("2 of 3")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Previous image" }));
    await fireEvent.press(screen.getByRole("button", { name: "Previous image" }));
    expect(screen.getByText("3 of 3")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Close image viewer" }));
    expect(screen.queryByText("3 of 3")).toBeNull();
  });

  it("says so when the product doesn't exist", async () => {
    mockParams = { slug: "gone" };
    mockApi.getProduct.mockRejectedValue(new ApiError({ status: 404, code: "notFound", serverMessage: "Not found" }));
    await renderIn("ar", <ProductScreen />);
    expect(await screen.findByText("مش لاقيين الصفحة دي.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "ارجعي للرئيسية" }));
    expect(mockRouter.dismissTo).toHaveBeenCalledWith("/");
  });
});
