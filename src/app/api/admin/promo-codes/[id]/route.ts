import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { promoCodeSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = promoCodeSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid promo code data" }, { status: 400 });
  const data = parsed.data;

  const promoCode = await prisma.promoCode.update({
    where: { id: params.id },
    data: {
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : data.startsAt === "" ? null : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : data.expiresAt === "" ? null : undefined,
    },
  });
  return NextResponse.json({ promoCode });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  await prisma.promoCode.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
