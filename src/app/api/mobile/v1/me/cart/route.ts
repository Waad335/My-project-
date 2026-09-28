import { readAccountState, replaceSavedCart, savedCartSchema } from "@/lib/account-sync";
import { requireMobileCustomer } from "@/lib/mobile/auth";
import { toSavedCart } from "@/lib/mobile/dto";
import { apiError, apiJson, mobileRoute, readJson } from "@/lib/mobile/http";
import type { CartResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// The saved cart, rebuilt from live product data (same as the website).
export const GET = mobileRoute(async (request) => {
  const auth = await requireMobileCustomer(request);
  if (auth.response) return auth.response;
  const { cart } = await readAccountState(auth.customer.id);
  const body: CartResponse = { cart: toSavedCart(cart) };
  return apiJson(body);
});

// Replaces the saved cart. Body: { items: [{ productId, variantId, quantity }] }.
// Returns the saved cart as the server now sees it.
export const PUT = mobileRoute(async (request) => {
  const auth = await requireMobileCustomer(request);
  if (auth.response) return auth.response;
  const read = await readJson(request);
  if ("response" in read) return read.response;
  const parsed = savedCartSchema.safeParse(read.body);
  if (!parsed.success) return apiError(request, 400, "invalidRequest");

  await replaceSavedCart(auth.customer.id, parsed.data.items);
  const { cart } = await readAccountState(auth.customer.id);
  const body: CartResponse = { cart: toSavedCart(cart) };
  return apiJson(body);
});
