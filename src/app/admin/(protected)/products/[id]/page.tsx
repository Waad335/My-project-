import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
    }),
    prisma.category.findMany({ include: { subcategories: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (!product) notFound();

  const initial: ProductFormValues = {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    nameEn: product.nameEn,
    nameAr: product.nameAr,
    descriptionEn: product.descriptionEn,
    descriptionAr: product.descriptionAr,
    ingredientsEn: product.ingredientsEn ?? "",
    ingredientsAr: product.ingredientsAr ?? "",
    warningsEn: product.warningsEn ?? "",
    warningsAr: product.warningsAr ?? "",
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId ?? "",
    price: toNumber(product.price),
    oldPrice: product.oldPrice ? toNumber(product.oldPrice) : "",
    salePrice: product.salePrice ? toNumber(product.salePrice) : "",
    stock: product.stock,
    availability: product.availability,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    isNewArrival: product.isNewArrival,
    isActive: product.isActive,
    images: product.images.map((i) => ({ url: i.url, altEn: i.altEn, altAr: i.altAr })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      color: v.color,
      colorHex: v.colorHex,
      size: v.size,
      priceDelta: toNumber(v.priceDelta),
      stock: v.stock,
      isDefault: v.isDefault,
    })),
  };

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-mocha-700">Edit Product</h1>
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, nameEn: c.nameEn, subcategories: c.subcategories.map((s) => ({ id: s.id, nameEn: s.nameEn })) }))}
        initial={initial}
      />
    </div>
  );
}
