import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameAr: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
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
    const product = await prisma.product.create({
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
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "A product with this SKU or slug already exists." }, { status: 409 });
  }
}
