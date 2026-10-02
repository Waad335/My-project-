import { readFileSync } from "fs";
import { join } from "path";
import {
  cardBadge,
  defaultVariantId,
  detailRows,
  isOutOfStock,
  localized,
  LOW_STOCK_THRESHOLD,
  purchaseState,
  roundedRating,
  splitVariants,
} from "@/catalog/product-logic";
import { activeFilterCount, BROWSE_SORTS, isValidPriceRange, parsePrice, sanitizePriceInput } from "@/catalog/filters";
import { card, detail, variant } from "./helpers/catalog-fixtures";

const website = (path: string) => readFileSync(join(__dirname, "..", "..", path), "utf8");

describe("product rules (ported from the website)", () => {
  it("picks one card badge: sale beats best seller beats new", () => {
    expect(cardBadge(card({ oldPrice: 750, effectivePrice: 620, isBestSeller: true, isNewArrival: true }))).toEqual({
      kind: "sale",
      discount: 17,
    });
    expect(cardBadge(card({ isBestSeller: true, isNewArrival: true }))).toEqual({ kind: "bestSeller" });
    expect(cardBadge(card({ isNewArrival: true }))).toEqual({ kind: "new" });
    expect(cardBadge(card())).toBeNull();
    // An old price that isn't higher is not a sale.
    expect(cardBadge(card({ oldPrice: 400, effectivePrice: 500 }))).toBeNull();
  });

  it("treats only stock-tracked products as able to run out", () => {
    expect(isOutOfStock(card({ stock: 0 }))).toBe(true);
    expect(isOutOfStock(card({ availability: "OUT_OF_STOCK", stock: 9 }))).toBe(true);
    expect(isOutOfStock(card({ trackStock: false, stock: 0 }))).toBe(false);
    expect(isOutOfStock(card({ stock: 3 }))).toBe(false);
  });

  it("opens on the default variant, else the first", () => {
    expect(defaultVariantId(detail())).toBeNull();
    expect(defaultVariantId(detail({ variants: [variant({ id: "a" }), variant({ id: "b", isDefault: true })] }))).toBe("b");
    expect(defaultVariantId(detail({ variants: [variant({ id: "a" }), variant({ id: "b" })] }))).toBe("a");
  });

  it("splits colours and sizes exactly like the purchase panel", () => {
    const red = variant({ id: "red", color: "Red" });
    const small = variant({ id: "s", size: "S" });
    const redLarge = variant({ id: "rl", color: "Red", size: "L" });
    expect(splitVariants([red, small, redLarge])).toEqual({ colors: [red], sizes: [small, redLarge] });
  });

  it("prices and stock follow the chosen variant", () => {
    const product = detail({
      effectivePrice: 550,
      stock: 40,
      variants: [variant({ id: "20", size: "20ml", stock: 3 }), variant({ id: "50", size: "50ml", priceDelta: 250, stock: 0 })],
    });
    expect(purchaseState(product, "20")).toMatchObject({ unitPrice: 550, stock: 3, stockTracked: true, outOfStock: false, stockStatus: "low" });
    expect(purchaseState(product, "50")).toMatchObject({ unitPrice: 800, stock: 0, outOfStock: true, stockStatus: "out" });
    expect(purchaseState(detail({ stock: 40 }), null)).toMatchObject({ unitPrice: 500, stockStatus: "in" });
  });

  it("never shows a quantity for made-to-order products", () => {
    const madeToOrder = detail({ trackStock: false, stock: 0 });
    expect(purchaseState(madeToOrder, null)).toMatchObject({ stockTracked: false, outOfStock: false, stockStatus: "in" });
    // Variants are always stock-tracked, even on such a product.
    const withVariant = detail({ trackStock: false, variants: [variant({ id: "v", stock: 0 })] });
    expect(purchaseState(withVariant, "v")).toMatchObject({ stockTracked: true, outOfStock: true });
  });

  it("builds the details table in the website's order", () => {
    const labels = {
      category: "Category",
      subcategory: "Type",
      color: "Color",
      size: "Size",
      availability: "Availability",
      sku: "SKU",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
    };
    const product = detail({
      subcategoryNameEn: "Serums",
      subcategoryNameAr: "سيروم",
      variants: [variant({ color: "Rose" }), variant({ id: "v2", color: "Rose", size: "30ml" }), variant({ id: "v3", size: "50ml" })],
    });
    expect(detailRows(product, "en", labels)).toEqual([
      ["Category", "Skincare"],
      ["Type", "Serums"],
      ["Color", "Rose"],
      ["Size", "30ml, 50ml"],
      ["Availability", "In Stock"],
      ["SKU", "DOD-SKN-001"],
    ]);
    expect(detailRows(detail(), "ar", labels).map(([term]) => term)).toEqual(["Category", "Availability", "SKU"]);
    expect(detailRows(detail(), "ar", labels)[0]).toEqual(["Category", "العناية بالبشرة"]);
  });

  it("rounds ratings to half stars and picks the customer's language", () => {
    expect(roundedRating(4.26)).toBe(4.5);
    expect(roundedRating(4.24)).toBe(4);
    expect(localized("ar", "Rose", "ورد")).toBe("ورد");
    expect(localized("en", "Rose", "ورد")).toBe("Rose");
  });

  it("uses the website's own thresholds and badge maths", () => {
    const cardSource = website("src/components/product/product-card.tsx");
    const panel = website("src/components/product/product-purchase-panel.tsx");
    expect(cardSource).toContain(`product.stock < ${LOW_STOCK_THRESHOLD}`);
    expect(panel).toContain(`stock < ${LOW_STOCK_THRESHOLD}`);
    expect(cardSource).toContain("Math.round(((product.oldPrice - product.effectivePrice) / product.oldPrice) * 100)");
    expect(panel).toContain('product.variants.filter((v) => v.color && !v.size)');
    expect(panel).toContain("product.variants.filter((v) => v.size)");
  });
});

describe("browse filters", () => {
  it("offers exactly the website's /shop sort options", () => {
    const controls = website("src/components/shop/shop-controls.tsx");
    const match = controls.match(/const SORTS = \[([^\]]+)\] as const/);
    const websiteSorts = match?.[1]?.split(",").map((s) => s.trim().replace(/"/g, ""));
    expect(websiteSorts).toEqual([...BROWSE_SORTS]);
  });

  it("keeps price inputs to digits, including Arabic-Indic digits", () => {
    expect(sanitizePriceInput("1,500 EGP")).toBe("1500");
    expect(sanitizePriceInput("٢٥٠")).toBe("250");
    expect(sanitizePriceInput("123456789")).toBe("1234567");
    expect(parsePrice("")).toBeUndefined();
    expect(parsePrice("0")).toBe(0);
  });

  it("accepts open-ended and equal ranges but not min above max", () => {
    expect(isValidPriceRange(undefined, 300)).toBe(true);
    expect(isValidPriceRange(300, undefined)).toBe(true);
    expect(isValidPriceRange(300, 300)).toBe(true);
    expect(isValidPriceRange(900, 300)).toBe(false);
  });

  it("counts filters that differ from the screen's defaults", () => {
    expect(activeFilterCount({ sort: "featured" }, "featured")).toBe(0);
    expect(activeFilterCount({ sort: "newest" }, "featured")).toBe(1);
    expect(activeFilterCount({ sort: "newest", minPrice: 100 }, "newest")).toBe(1);
    expect(activeFilterCount({ sort: "price-asc", maxPrice: 900 }, "newest")).toBe(2);
  });
});
