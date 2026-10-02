import { useEffect, useState } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { queryKeys } from "@/api/query-client";
import type { ProductListParams } from "@/api/endpoints";

// Catalog data for the browsing screens. Every response already contains
// both languages, so switching language never refetches.

export const catalogKeys = {
  home: queryKeys.home,
  categories: ["catalog", "categories"] as const,
  category: (slug: string) => ["catalog", "category", slug] as const,
  products: (params: ProductListParams) => ["catalog", "products", params] as const,
  product: (slug: string) => ["catalog", "product", slug] as const,
  suggest: (q: string) => ["catalog", "suggest", q] as const,
  settings: queryKeys.settings,
};

export const PRODUCT_PAGE_SIZE = 20;

export function useHome() {
  return useQuery({ queryKey: catalogKeys.home, queryFn: api.getHome });
}

export function useCategories() {
  return useQuery({ queryKey: catalogKeys.categories, queryFn: api.getCategories, staleTime: 5 * 60_000 });
}

export function useCategory(slug: string) {
  return useQuery({ queryKey: catalogKeys.category(slug), queryFn: () => api.getCategory(slug), enabled: Boolean(slug) });
}

export function useSettings() {
  return useQuery({ queryKey: catalogKeys.settings, queryFn: api.getSettings, staleTime: 5 * 60_000 });
}

export function useProduct(slug: string) {
  return useQuery({ queryKey: catalogKeys.product(slug), queryFn: () => api.getProduct(slug), enabled: Boolean(slug) });
}

// Infinite product listing (Shop, category screens, search results). The
// API returns empty pages past the end, so nothing is ever repeated.
export function useProductList(params: Omit<ProductListParams, "page" | "pageSize">) {
  const filters = { ...params, pageSize: PRODUCT_PAGE_SIZE };
  return useInfiniteQuery({
    queryKey: catalogKeys.products(filters),
    queryFn: ({ pageParam }) => api.listProducts({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pageCount ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export const SUGGEST_MIN_LENGTH = 2;

// Type-ahead suggestions, same rule as the website's search box: at least
// two characters, a short pause after typing, at most five products.
export function useSearchSuggestions(query: string) {
  const q = useDebouncedValue(query.trim(), 250);
  return useQuery({
    queryKey: catalogKeys.suggest(q),
    queryFn: () => api.searchSuggest(q),
    enabled: q.length >= SUGGEST_MIN_LENGTH,
    staleTime: 60_000,
  });
}
