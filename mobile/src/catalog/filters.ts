import type { ProductSort } from "@shared/api-types";

// Browsing filters for the Shop and category screens. The sort list is the
// website's /shop sort menu (src/components/shop/shop-controls.tsx); the
// price range uses the API's minPrice/maxPrice on the list price, like the
// website's category page (?min= &max=).

export const BROWSE_SORTS = ["featured", "newest", "price-asc", "price-desc"] as const satisfies readonly ProductSort[];
export type BrowseSort = (typeof BROWSE_SORTS)[number];

export type BrowseFilters = {
  sort: BrowseSort;
  minPrice?: number;
  maxPrice?: number;
};

// The API accepts prices up to 10,000,000 EGP; seven digits stays below it.
export const PRICE_MAX_DIGITS = 7;

// Keeps only digits, so pasted text like "1,500 EGP" becomes "1500".
export function sanitizePriceInput(text: string): string {
  return text.replace(/[^0-9٠-٩]/g, "").replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).slice(0, PRICE_MAX_DIGITS);
}

export function parsePrice(text: string): number | undefined {
  const digits = sanitizePriceInput(text);
  return digits ? Number(digits) : undefined;
}

export function isValidPriceRange(minPrice: number | undefined, maxPrice: number | undefined): boolean {
  return minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice;
}

// How many filters differ from the screen's defaults (shown on the Filter button).
export function activeFilterCount(filters: BrowseFilters, defaultSort: BrowseSort): number {
  return (filters.sort !== defaultSort ? 1 : 0) + (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0);
}
