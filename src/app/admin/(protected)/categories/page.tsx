import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { subcategories: true, _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <CategoryManager
      categories={categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        emoji: c.emoji,
        descriptionEn: c.descriptionEn,
        descriptionAr: c.descriptionAr,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        subcategories: c.subcategories,
        productCount: c._count.products,
      }))}
    />
  );
}
