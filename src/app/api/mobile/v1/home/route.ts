import { getHome } from "@/lib/mobile/catalog";
import { apiJson, mobileRoute } from "@/lib/mobile/http";

export const dynamic = "force-dynamic";

// Home screen: hero showcase, the "Shop by category" cards, departments,
// featured, new arrivals and best sellers.
export const GET = mobileRoute(async () => apiJson(await getHome(), { cache: "public" }));
