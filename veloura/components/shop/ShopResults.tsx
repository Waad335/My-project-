"use client";

import { useShopTransitionStore } from "@/lib/store";
import { ProductGrid } from "./ProductGrid";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import type { ShopifyProduct } from "@/types/shopify";

/**
 * Thin client wrapper around ProductGrid. ShopFilters (a sibling under the
 * server-rendered /shop page) reports its pending navigation state into
 * useShopTransitionStore; this component reads it to show a skeleton in
 * place of the (now-stale) product list while the filtered results load.
 */
export function ShopResults({ products }: { products: ShopifyProduct[] }) {
  const isPending = useShopTransitionStore((s) => s.isPending);

  if (isPending) {
    return <ProductGridSkeleton count={Math.min(Math.max(products.length, 3), 9)} />;
  }

  return <ProductGrid products={products} />;
}
