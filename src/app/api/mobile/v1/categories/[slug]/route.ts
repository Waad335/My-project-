import { getCategoryBySlug } from "@/lib/queries";
import { navCategoryLabel } from "@/lib/categories-nav";
import { absoluteUrl } from "@/lib/mobile/dto";
import { apiError, apiJson, mobileRoute } from "@/lib/mobile/http";
import type { CategoryResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// One category (active or not, like the website's /category/<slug> page)
// with its active subcategories. Its products come from GET /products.
export const GET = mobileRoute(async (request, { params }) => {
  const category = await getCategoryBySlug(params.slug ?? "");
  if (!category) return apiError(request, 404, "notFound");
  const body: CategoryResponse = {
    category: {
      id: category.id,
      slug: category.slug,
      nameEn: navCategoryLabel(category, "en"),
      nameAr: navCategoryLabel(category, "ar"),
      descriptionEn: category.descriptionEn,
      descriptionAr: category.descriptionAr,
      image: absoluteUrl(category.image),
      subcategories: category.subcategories.map((s) => ({ id: s.id, slug: s.slug, nameEn: s.nameEn, nameAr: s.nameAr })),
    },
  };
  return apiJson(body, { cache: "public" });
});
