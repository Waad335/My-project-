import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validation";
import { z } from "zod";

const updateSchema = categorySchema.extend({
  subcategories: z
    .array(z.object({ id: z.string().optional(), slug: z.string().min(1), nameEn: z.string().min(1), nameAr: z.string().min(1) }))
    .optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category data", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const category = await prisma.$transaction(async (tx) => {
      if (data.subcategories) {
        const keepIds = data.subcategories.filter((s) => s.id).map((s) => s.id!);
        await tx.subcategory.deleteMany({ where: { categoryId: params.id, id: { notIn: keepIds } } });
        for (const sub of data.subcategories) {
          if (sub.id) {
            await tx.subcategory.update({ where: { id: sub.id }, data: { slug: sub.slug, nameEn: sub.nameEn, nameAr: sub.nameAr } });
          } else {
            await tx.subcategory.create({ data: { slug: sub.slug, nameEn: sub.nameEn, nameAr: sub.nameAr, categoryId: params.id } });
          }
        }
      }

      return tx.category.update({
        where: { id: params.id },
        data: {
          slug: data.slug,
          nameEn: data.nameEn,
          nameAr: data.nameAr,
          descriptionEn: data.descriptionEn || null,
          descriptionAr: data.descriptionAr || null,
          emoji: data.emoji || null,
          image: data.image || null,
          sortOrder: data.sortOrder ?? 0,
          isActive: data.isActive ?? true,
        },
      });
    });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "Could not update category." }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const productCount = await prisma.product.count({ where: { categoryId: params.id } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${productCount} product(s) still use this category.` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
