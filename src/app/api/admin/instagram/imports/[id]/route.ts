import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  detectedNameEn: z.string().trim().min(1).optional(),
  detectedPriceEGP: z.number().positive().nullable().optional(),
  detectedCategorySlug: z.string().trim().min(1).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid import data" }, { status: 400 });
  }
  const data = parsed.data;

  const importRow = await prisma.instagramImport.update({
    where: { id: params.id },
    data: {
      ...(data.detectedNameEn !== undefined ? { detectedNameEn: data.detectedNameEn } : {}),
      ...(data.detectedPriceEGP !== undefined
        ? { detectedPriceEGP: data.detectedPriceEGP, priceNeedsReview: data.detectedPriceEGP === null }
        : {}),
      ...(data.detectedCategorySlug !== undefined
        ? { detectedCategorySlug: data.detectedCategorySlug, categoryNeedsReview: data.detectedCategorySlug === null }
        : {}),
      status: "READY",
    },
  });

  return NextResponse.json({ import: importRow });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  await prisma.instagramImport.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
