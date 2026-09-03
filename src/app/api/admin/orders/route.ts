import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : undefined,
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}
