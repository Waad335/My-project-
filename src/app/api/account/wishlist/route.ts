import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { replaceSavedWishlist, savedWishlistSchema } from "@/lib/account-sync";

// Replaces the signed-in customer's saved wishlist with the client's list.
export async function PUT(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = savedWishlistSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid wishlist" }, { status: 400 });

  const count = await replaceSavedWishlist(customer.id, parsed.data.productIds);
  return NextResponse.json({ ok: true, count });
}
