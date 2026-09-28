import { searchProducts } from "@/lib/queries";
import { toProductCard } from "@/lib/mobile/dto";
import { apiJson, mobileRoute } from "@/lib/mobile/http";
import type { SearchSuggestResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// Type-ahead suggestions, same rules as the website's search box: at least
// 2 characters, up to 5 products.
export const GET = mobileRoute(async (request) => {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  const body: SearchSuggestResponse = { products: q.length < 2 ? [] : (await searchProducts(q, 5)).map(toProductCard) };
  return apiJson(body, { cache: "public" });
});
