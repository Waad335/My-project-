import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";

const schema = z.object({ productIds: z.array(z.string().min(1).max(64)).max(200) });

// Replaces the signed-in customer's saved wishlist with the client's list.
export async function PUT(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid wishlist" }, { status: 400 });

  const ids = Array.from(new Set(parsed.data.productIds));
  const existing = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const validIds = ids.filter((id) => existing.some((p) => p.id === id));

  await prisma.$transaction([
    prisma.wishlistItem.deleteMany({ where: { userId: customer.id } }),
    prisma.wishlistItem.createMany({ data: validIds.map((productId) => ({ userId: customer.id, productId })) }),
  ]);
  return NextResponse.json({ ok: true, count: validIds.length });
}
