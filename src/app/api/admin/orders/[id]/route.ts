import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { orderStatusUpdateSchema } from "@/lib/validation";
import { z } from "zod";

const patchSchema = orderStatusUpdateSchema.extend({
  internalNotes: z.string().trim().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status update" }, { status: 400 });
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
