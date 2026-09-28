import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { replaceSavedCart, savedCartSchema } from "@/lib/account-sync";

// Replaces the signed-in customer's saved cart with the client's current cart.
export async function PUT(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = savedCartSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });

  const count = await replaceSavedCart(customer.id, parsed.data.items);
  return NextResponse.json({ ok: true, count });
}
