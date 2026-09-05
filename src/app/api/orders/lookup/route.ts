import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

const schema = z.object({ orderNumber: z.string().trim().min(1), phone: z.string().trim().min(8) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ found: false }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber.trim().toUpperCase() },
    include: { items: true, customer: true },
  });

  if (!order || order.customer.phone !== parsed.data.phone.trim()) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: toNumber(order.total),
      createdAt: order.createdAt.toISOString(),
      shippingMethodLabel: order.shippingMethodLabel,
      items: order.items.map((i) => ({
        nameEn: i.nameEnSnapshot,
        nameAr: i.nameArSnapshot,
        quantity: i.quantity,
        lineTotal: toNumber(i.lineTotal),
      })),
    },
  });
}
