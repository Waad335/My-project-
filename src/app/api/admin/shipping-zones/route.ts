import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { shippingZoneSchema } from "@/lib/validation";

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;
  const zones = await prisma.shippingZone.findMany({ orderBy: { governorate: "asc" } });
  return NextResponse.json({ zones });
}

export async function POST(request: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = shippingZoneSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid shipping zone data" }, { status: 400 });

  try {
    const zone = await prisma.shippingZone.create({ data: parsed.data });
    return NextResponse.json({ zone }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A zone for this governorate already exists." }, { status: 409 });
  }
}
