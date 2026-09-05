import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { slugify, toNumber } from "@/lib/utils";

const publishSchema = z.object({ stock: z.number().int().min(0) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a stock quantity (0 or more)." }, { status: 400 });
  }

  const importRow = await prisma.instagramImport.findUnique({ where: { id: params.id } });
  if (!importRow) return NextResponse.json({ error: "Import not found." }, { status: 404 });

  if (!importRow.detectedNameEn) {
    return NextResponse.json({ error: "This import needs a product name before it can be published." }, { status: 409 });
  }
  if (importRow.detectedPriceEGP === null || importRow.priceNeedsReview) {
    return NextResponse.json({ error: "This import needs a reviewed price before it can be published." }, { status: 409 });
  }
  if (!importRow.detectedCategorySlug || importRow.categoryNeedsReview) {
    return NextResponse.json({ error: "This import needs a reviewed category before it can be published." }, { status: 409 });
  }

  const category = await prisma.category.findUnique({ where: { slug: importRow.detectedCategorySlug } });
  if (!category) {
    return NextResponse.json({ error: `Category "${importRow.detectedCategorySlug}" no longer exists.` }, { status: 409 });
  }

  const stock = parsed.data.stock;
  const availability = stock === 0 ? "OUT_OF_STOCK" : stock < 10 ? "LOW_STOCK" : "IN_STOCK";
  const price = toNumber(importRow.detectedPriceEGP);
  const baseSlug = slugify(importRow.detectedNameEn);
  const baseSku = `IG-${importRow.mediaId.slice(-8)}`;

  const product = await prisma.$transaction(async (tx) => {
    if (importRow.publishedProductId) {
      const updated = await tx.product.update({
        where: { id: importRow.publishedProductId },
        data: {
          nameEn: importRow.detectedNameEn!,
          nameAr: importRow.detectedNameEn!,
          price,
          stock,
          availability,
          categoryId: category.id,
        },
      });
      return updated;
    }

    const slug = await uniqueSlug(tx, baseSlug);

    const created = await tx.product.create({
      data: {
        sku: baseSku,
        slug,
        nameEn: importRow.detectedNameEn!,
        nameAr: importRow.detectedNameEn!,
        descriptionEn: importRow.caption || importRow.detectedNameEn!,
        descriptionAr: importRow.caption || importRow.detectedNameEn!,
        categoryId: category.id,
        price,
        stock,
        availability,
        isActive: true,
        images: importRow.storedImageUrl
          ? { create: [{ url: importRow.storedImageUrl, altEn: importRow.detectedNameEn!, sortOrder: 0 }] }
          : undefined,
      },
    });

    await tx.instagramImport.update({
      where: { id: importRow.id },
      data: { publishedProductId: created.id },
    });

    return created;
  });

  await prisma.instagramImport.update({ where: { id: importRow.id }, data: { status: "PUBLISHED" } });

  return NextResponse.json({ product: { id: product.id, slug: product.slug } });
}

async function uniqueSlug(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], base: string): Promise<string> {
  let candidate = base || "ig-product";
  let suffix = 1;
  while (await tx.product.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
