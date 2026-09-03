import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { promoCodeSchema } from "@/lib/validation";

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;
  const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ promoCodes });
}

export async function POST(request: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = promoCodeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid promo code data" }, { status: 400 });
  const data = parsed.data;

  try {
    const promoCode = await prisma.promoCode.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        minOrderValue: data.minOrderValue || null,
        maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive ?? true,
      },
    });
    return NextResponse.json({ promoCode }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A promo code with this code already exists." }, { status: 409 });
  }
}
