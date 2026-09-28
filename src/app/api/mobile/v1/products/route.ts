import { listProducts, productListQuerySchema } from "@/lib/mobile/catalog";
import { apiError, apiJson, mobileRoute } from "@/lib/mobile/http";

export const dynamic = "force-dynamic";

// Product listing: ?q= &category= &sub= &sort= &minPrice= &maxPrice= &page= &pageSize=
export const GET = mobileRoute(async (request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = productListQuerySchema.safeParse(params);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0] ?? "query"), i.message]));
    return apiError(request, 400, "invalidRequest", { fieldErrors });
  }
  return apiJson(await listProducts(parsed.data), { cache: "public" });
});
