import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-guard";
import { can } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { admin, response } = await requireAdminPermission("orders.view");
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : undefined,
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  // Only roles with customers.email see the customer's email address.
  const showEmail = can(admin.role, "customers.email");
  return NextResponse.json({
    orders: showEmail ? orders : orders.map((o) => ({ ...o, customer: { ...o.customer, email: null } })),
  });
}
