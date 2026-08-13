import type { Metadata } from "next";
import { Suspense } from "react";
import { getCollections, getProducts } from "@/lib/shopify";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { Reveal } from "@/components/ui/Reveal";
import type { ProductFilterOptions } from "@/types/shopify";

export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Browse the complete VELOURA catalogue of premium digital templates, planners, and brand kits.",
  alternates: { canonical: "/shop" },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function sortToOptions(sort?: string): Pick<ProductFilterOptions, "sortKey" | "reverse"> {
  switch (sort) {
    case "best-selling":
      return { sortKey: "BEST_SELLING", reverse: false };
    case "price-asc":
      return { sortKey: "PRICE", reverse: false };
    case "price-desc":
      return { sortKey: "PRICE", reverse: true };
    case "newest":
      return { sortKey: "CREATED_AT", reverse: true };
    case "title-asc":
      return { sortKey: "TITLE", reverse: false };
    default:
      return { sortKey: "RELEVANCE", reverse: false };
  }
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const collection = typeof params.collection === "string" ? params.collection : undefined;
  const min = typeof params.min === "string" && params.min ? Number(params.min) : undefined;
  const max = typeof params.max === "string" && params.max ? Number(params.max) : undefined;
  const sort = typeof params.sort === "string" ? params.sort : undefined;

  const [products, collections] = await Promise.all([
    getProducts({
      query: q,
      collectionHandle: collection,
      minPrice: min,
      maxPrice: max,
      ...sortToOptions(sort),
    }),
    getCollections(),
  ]);

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-32 md:px-10 lg:px-14 lg:pt-40">
      <Reveal className="mb-14 max-w-2xl">
        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold">Shop</p>
        <h1 className="font-serif-display text-4xl leading-[1.05] sm:text-5xl">
          The Full Collection
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {products.length} product{products.length === 1 ? "" : "s"} — refine by category, price, or search.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <Suspense fallback={null}>
            <ShopFilters collections={collections} />
          </Suspense>
        </aside>
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
