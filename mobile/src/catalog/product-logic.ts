import type { ProductCard, ProductDetail, ProductVariant } from "@shared/api-types";
import type { Locale } from "@/i18n/config";

// The website's product rules, ported one-to-one so the app shows exactly
// what the website shows:
// - card badge and "on sale": src/components/product/product-card.tsx
// - variants, price and stock: src/components/product/product-purchase-panel.tsx
// - the details table: src/app/product/[slug]/page.tsx

export function localized(locale: Locale, en: string, ar: string): string;
export function localized(locale: Locale, en: string | null, ar: string | null): string | null;
export function localized(locale: Locale, en: string | null, ar: string | null): string | null {
  return locale === "ar" ? ar : en;
}

export type CardBadge = { kind: "sale"; discount: number } | { kind: "bestSeller" } | { kind: "new" } | null;

// One badge per card: a sale beats "Best Seller", which beats "New".
export function cardBadge(product: ProductCard): CardBadge {
  const { oldPrice, effectivePrice } = product;
  if (oldPrice && oldPrice > effectivePrice) {
    return { kind: "sale", discount: Math.round(((oldPrice - effectivePrice) / oldPrice) * 100) };
  }
  if (product.isBestSeller) return { kind: "bestSeller" };
  if (product.isNewArrival) return { kind: "new" };
  return null;
}

export function isOutOfStock(product: Pick<ProductCard, "trackStock" | "availability" | "stock">): boolean {
  return product.trackStock && (product.availability === "OUT_OF_STOCK" || product.stock === 0);
}

// The variant selected when the page opens: the one marked default, else the first.
export function defaultVariantId(product: Pick<ProductDetail, "variants">): string | null {
  if (product.variants.length === 0) return null;
  return (product.variants.find((v) => v.isDefault) ?? product.variants[0]!).id;
}

// Colour choices are variants with a colour and no size; anything with a
// size is offered as a size (the website's split, kept as-is).
export function splitVariants(variants: ProductVariant[]): { colors: ProductVariant[]; sizes: ProductVariant[] } {
  return {
    colors: variants.filter((v) => v.color && !v.size),
    sizes: variants.filter((v) => v.size),
  };
}

export type StockStatus = "out" | "low" | "in";

export type PurchaseState = {
  variant: ProductVariant | null;
  unitPrice: number;
  stock: number;
  // Variants are always stock-tracked; a product without variants can opt
  // out (made to order), in which case no quantity is ever shown.
  stockTracked: boolean;
  outOfStock: boolean;
  stockStatus: StockStatus;
};

export const LOW_STOCK_THRESHOLD = 10;

export function purchaseState(product: ProductDetail, variantId: string | null): PurchaseState {
  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = product.effectivePrice + (variant?.priceDelta ?? 0);
  const stock = variant ? variant.stock : product.stock;
  const stockTracked = variant ? true : product.trackStock;
  const outOfStock = stockTracked && (product.availability === "OUT_OF_STOCK" || stock === 0);
  const stockStatus: StockStatus = outOfStock ? "out" : stockTracked && stock < LOW_STOCK_THRESHOLD ? "low" : "in";
  return { variant, unitPrice, stock, stockTracked, outOfStock, stockStatus };
}

export type DetailLabels = {
  category: string;
  subcategory: string;
  color: string;
  size: string;
  availability: string;
  sku: string;
  inStock: string;
  outOfStock: string;
};

// The website's "Details" table, in the same order.
export function detailRows(product: ProductDetail, locale: Locale, labels: DetailLabels): [string, string][] {
  const unique = (values: (string | null)[]) => Array.from(new Set(values.filter((v): v is string => Boolean(v))));
  const colors = unique(product.variants.map((v) => v.color));
  const sizes = unique(product.variants.map((v) => v.size));
  const subcategoryName = localized(locale, product.subcategoryNameEn, product.subcategoryNameAr);
  return [
    [labels.category, localized(locale, product.categoryNameEn, product.categoryNameAr)],
    ...(subcategoryName ? ([[labels.subcategory, subcategoryName]] as [string, string][]) : []),
    ...(colors.length ? ([[labels.color, colors.join(", ")]] as [string, string][]) : []),
    ...(sizes.length ? ([[labels.size, sizes.join(", ")]] as [string, string][]) : []),
    [labels.availability, isOutOfStock(product) ? labels.outOfStock : labels.inStock],
    [labels.sku, product.sku],
  ];
}

// Star display rounds to the nearest half star, as on the website.
export function roundedRating(rating: number): number {
  return Math.round(rating * 2) / 2;
}
