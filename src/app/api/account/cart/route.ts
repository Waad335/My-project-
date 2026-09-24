import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        variantId: z.string().min(1).max(64).nullable(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .max(100),
});

// Replaces the signed-in customer's saved cart with the client's current cart.
export async function PUT(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });

  // Only keep lines that point at real products / variants.
  const productIds = Array.from(new Set(parsed.data.items.map((i) => i.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, variants: { select: { id: true } } },
  });
  const valid = new Map(products.map((p) => [p.id, new Set(p.variants.map((v) => v.id))]));
  const seen = new Set<string>();
  const rows = parsed.data.items.filter((i) => {
    const variants = valid.get(i.productId);
    if (!variants || (i.variantId && !variants.has(i.variantId))) return false;
    const key = `${i.productId}:${i.variantId ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { userId: customer.id } }),
    prisma.cartItem.createMany({
      data: rows.map((i) => ({ userId: customer.id, productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
    }),
  ]);
  return NextResponse.json({ ok: true, count: rows.length });
}
