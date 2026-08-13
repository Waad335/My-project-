"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { ShopifyCollection } from "@/types/shopify";

const SORT_OPTIONS = [
  { label: "Featured", value: "" },
  { label: "Best Selling", value: "best-selling" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest", value: "newest" },
  { label: "Alphabetical: A–Z", value: "title-asc" },
];

export function ShopFilters({ collections }: { collections: ShopifyCollection[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") ?? "");

  const activeCollection = searchParams.get("collection") ?? "";
  const activeSort = searchParams.get("sort") ?? "";

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query !== (searchParams.get("q") ?? "")) updateParams({ q: query || null });
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentMin = searchParams.get("min") ?? "";
      const currentMax = searchParams.get("max") ?? "";
      if (minPrice !== currentMin || maxPrice !== currentMax) {
        updateParams({ min: minPrice || null, max: maxPrice || null });
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice]);

  return (
    <div className={cn("flex flex-col gap-8 transition-opacity", isPending && "opacity-60")}>
      <div>
        <label htmlFor="shop-search" className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">
          Search
        </label>
        <input
          id="shop-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="w-full border-b border-black/20 bg-transparent py-2 text-sm placeholder:text-muted focus:border-black focus:outline-none"
        />
      </div>

      <div>
        <h3 className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">Category</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => updateParams({ collection: null })}
            className={cn(
              "text-left text-sm transition-colors hover:text-gold",
              !activeCollection ? "font-medium text-black" : "text-muted"
            )}
          >
            All Products
          </button>
          {collections.map((c) => (
            <button
              key={c.handle}
              onClick={() => updateParams({ collection: activeCollection === c.handle ? null : c.handle })}
              className={cn(
                "text-left text-sm transition-colors hover:text-gold",
                activeCollection === c.handle ? "font-medium text-black" : "text-muted"
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">Price</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
            className="w-full border-b border-black/20 bg-transparent py-2 text-sm placeholder:text-muted focus:border-black focus:outline-none"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            aria-label="Maximum price"
            className="w-full border-b border-black/20 bg-transparent py-2 text-sm placeholder:text-muted focus:border-black focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="shop-sort" className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">
          Sort By
        </label>
        <select
          id="shop-sort"
          value={activeSort}
          onChange={(e) => updateParams({ sort: e.target.value || null })}
          className="w-full border-b border-black/20 bg-transparent py-2 text-sm focus:border-black focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {(query || activeCollection || minPrice || maxPrice || activeSort) && (
        <button
          onClick={() => {
            setQuery("");
            setMinPrice("");
            setMaxPrice("");
            router.push(pathname, { scroll: false });
          }}
          className="self-start text-xs uppercase tracking-[0.16em] text-gold hover:text-black"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
