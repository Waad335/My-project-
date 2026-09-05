import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { shippingZoneSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = shippingZoneSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid shipping zone data" }, { status: 400 });

  const zone = await prisma.shippingZone.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ zone });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  await prisma.shippingZone.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
