import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { readAccountState } from "@/lib/account-sync";

export const dynamic = "force-dynamic";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await readAccountState(customer.id), { headers: { "Cache-Control": "no-store" } });
}
