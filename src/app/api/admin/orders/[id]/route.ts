import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-guard";
import { canSetOrderStatus } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { orderStatusUpdateSchema } from "@/lib/validation";
import { z } from "zod";

const patchSchema = orderStatusUpdateSchema.extend({
  internalNotes: z.string().trim().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { admin, response } = await requireAdminPermission("orders.fulfil");
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status update" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id: params.id }, select: { status: true } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  // STAFF may only move orders through fulfilment; payment/cancel/refund
  // states (and re-opening closed orders) need orders.finance.
  if (!canSetOrderStatus(admin.role, existing.status, parsed.data.status)) {
    return NextResponse.json({ error: "Your role can't set this order status." }, { status: 403 });
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      internalNotes: parsed.data.internalNotes,
      ...(parsed.data.status === "PAID" ? { paymentStatus: "PAID" } : {}),
      ...(parsed.data.status === "RETURNED_REFUNDED" ? { paymentStatus: "REFUNDED" } : {}),
    },
  });

  return NextResponse.json({ order });
}
