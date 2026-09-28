import { getActiveProduct } from "@/lib/mobile/catalog";
import { apiError, apiJson, mobileRoute } from "@/lib/mobile/http";

export const dynamic = "force-dynamic";

// Product detail (images, variants, reviews) plus related pieces.
export const GET = mobileRoute(async (request, { params }) => {
  const result = await getActiveProduct(params.slug ?? "");
  if (!result) return apiError(request, 404, "notFound");
  return apiJson(result, { cache: "public" });
});
