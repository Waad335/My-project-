import { readAccountState, replaceSavedWishlist, savedWishlistSchema } from "@/lib/account-sync";
import { requireMobileCustomer } from "@/lib/mobile/auth";
import { toSavedWishlist } from "@/lib/mobile/dto";
import { apiError, apiJson, mobileRoute, readJson } from "@/lib/mobile/http";
import type { WishlistResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// The saved wishlist (active products only, same as the website).
export const GET = mobileRoute(async (request) => {
  const auth = await requireMobileCustomer(request);
  if (auth.response) return auth.response;
  const { wishlist } = await readAccountState(auth.customer.id);
  const body: WishlistResponse = { wishlist: toSavedWishlist(wishlist) };
  return apiJson(body);
});

// Replaces the saved wishlist. Body: { productIds: string[] }.
export const PUT = mobileRoute(async (request) => {
  const auth = await requireMobileCustomer(request);
  if (auth.response) return auth.response;
  const read = await readJson(request);
  if ("response" in read) return read.response;
  const parsed = savedWishlistSchema.safeParse(read.body);
  if (!parsed.success) return apiError(request, 400, "invalidRequest");

  await replaceSavedWishlist(auth.customer.id, parsed.data.productIds);
  const { wishlist } = await readAccountState(auth.customer.id);
  const body: WishlistResponse = { wishlist: toSavedWishlist(wishlist) };
  return apiJson(body);
});
