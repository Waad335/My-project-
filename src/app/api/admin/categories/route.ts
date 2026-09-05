import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validation";
import { z } from "zod";

const createSchema = categorySchema.extend({
  subcategories: z.array(z.object({ slug: z.string().min(1), nameEn: z.string().min(1), nameAr: z.string().min(1) })).optional(),
});

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;

  const categories = await prisma.category.findMany({
    include: { subcategories: true, _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category data", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const category = await prisma.category.create({
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
        subcategories: data.subcategories?.length ? { create: data.subcategories } : undefined,
      },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });
  }
}
