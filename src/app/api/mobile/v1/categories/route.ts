import { getNavCategories, getShopCategories } from "@/lib/queries";
import { toDepartment, toShopCategory } from "@/lib/mobile/dto";
import { apiJson, mobileRoute } from "@/lib/mobile/http";
import type { CategoriesResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// The "Shop by category" cards plus every department with its subcategories.
export const GET = mobileRoute(async () => {
  const [shopCategories, departments] = await Promise.all([getShopCategories(), getNavCategories()]);
  const body: CategoriesResponse = {
    shopCategories: shopCategories.map(toShopCategory),
    departments: departments.map(toDepartment),
  };
  return apiJson(body, { cache: "public" });
});
