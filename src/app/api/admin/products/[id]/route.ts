import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product data", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const availability =
    data.stock === 0 ? "OUT_OF_STOCK" : data.stock < 10 ? "LOW_STOCK" : data.availability;

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: params.id } });
      await tx.productVariant.deleteMany({ where: { productId: params.id } });

      return tx.product.update({
        where: { id: params.id },
        data: {
          sku: data.sku,
          slug: data.slug,
          nameEn: data.nameEn,
          nameAr: data.nameAr,
          descriptionEn: data.descriptionEn,
          descriptionAr: data.descriptionAr,
          ingredientsEn: data.ingredientsEn || null,
          ingredientsAr: data.ingredientsAr || null,
          warningsEn: data.warningsEn || null,
          warningsAr: data.warningsAr || null,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId || null,
          price: data.price,
          oldPrice: data.oldPrice || null,
          salePrice: data.salePrice || null,
          stock: data.stock,
          availability,
          isFeatured: Boolean(data.isFeatured),
          isBestSeller: Boolean(data.isBestSeller),
          isNewArrival: Boolean(data.isNewArrival),
          isActive: data.isActive ?? true,
          images: data.images?.length
            ? { create: data.images.map((img, i) => ({ url: img.url, altEn: img.altEn, altAr: img.altAr, sortOrder: i })) }
            : undefined,
          variants: data.variants?.length
            ? {
                create: data.variants.map((v) => ({
                  sku: v.sku,
                  color: v.color || null,
                  colorHex: v.colorHex || null,
                  size: v.size || null,
                  priceDelta: v.priceDelta ?? 0,
                  stock: v.stock,
                  isDefault: Boolean(v.isDefault),
                })),
              }
            : undefined,
        },
      });
    });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Could not update product. Check SKU/slug uniqueness." }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const hasOrderHistory = await prisma.orderItem.findFirst({ where: { productId: params.id } });

  if (hasOrderHistory) {
    await prisma.product.update({ where: { id: params.id }, data: { isActive: false } });
    return NextResponse.json({
      softDeleted: true,
      message: "This product has order history, so it was deactivated instead of deleted.",
    });
  }

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
