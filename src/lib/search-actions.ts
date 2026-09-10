"use server";

import { searchProducts } from "@/lib/queries";
import type { ProductCardData } from "@/lib/serialize";

// Backs the navbar search suggestions dropdown — same searchProducts query
// the /search page itself uses, just capped to a small preview count.
export async function getSearchSuggestions(query: string): Promise<ProductCardData[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  return searchProducts(trimmed, 5);
}
