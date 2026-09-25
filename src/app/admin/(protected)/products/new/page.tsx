import { prisma } from "@/lib/prisma";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { requireAdminPage } from "@/lib/admin-guard";

export default async function NewProductPage() {
  await requireAdminPage("products.manage");
  const categories = await prisma.category.findMany({
    include: { subcategories: true },
    orderBy: { sortOrder: "asc" },
  });

  const initial: ProductFormValues = {
    sku: "",
    slug: "",
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    ingredientsEn: "",
    ingredientsAr: "",
    warningsEn: "",
    warningsAr: "",
    categoryId: categories[0]?.id ?? "",
    subcategoryId: "",
    price: 0,
    oldPrice: "",
    salePrice: "",
    stock: 0,
    trackStock: true,
    model3dUrl: "",
    availability: "IN_STOCK",
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isActive: true,
    images: [],
    variants: [],
  };

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-mocha-700">Add Product</h1>
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, nameEn: c.nameEn, subcategories: c.subcategories.map((s) => ({ id: s.id, nameEn: s.nameEn })) }))}
        initial={initial}
      />
    </div>
  );
}
