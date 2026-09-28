import { checkoutSchema } from "@/lib/validation";
import { createOrderFromCheckout, OrderCreationError } from "@/lib/orders";
import { getSiteSettings } from "@/lib/settings";
import { toNumber } from "@/lib/utils";
import { authenticateMobileRequest } from "@/lib/mobile/auth";
import { apiError, apiJson, mobileRoute, readJson } from "@/lib/mobile/http";
import type { CheckoutResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// Places an order — the same order logic as the website's checkout (prices,
// stock, shipping and promo codes are all re-derived on the server).
// v1 of the app supports Cash on Delivery only. Guests can check out
// without a token; with a valid token the order is linked to the account
// (an invalid/expired token is rejected, so the app can sign in again).
export const POST = mobileRoute(async (request) => {
  const auth = await authenticateMobileRequest(request);
  if (auth.status === "invalid") return apiError(request, 401, "unauthorized");

  const read = await readJson(request);
  if ("response" in read) return read.response;
  const parsed = checkoutSchema.safeParse(read.body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return apiError(request, 400, "invalidRequest", { fieldErrors });
  }
  if (parsed.data.paymentMethod !== "COD") return apiError(request, 400, "paymentMethodUnavailable");

  const settings = await getSiteSettings();
  if (!settings.codEnabled) return apiError(request, 400, "codUnavailable");

  const userId = auth.status === "customer" ? auth.customer.id : null;
  try {
    const order = await createOrderFromCheckout(parsed.data, { userId });
    const body: CheckoutResponse = {
      orderNumber: order.orderNumber,
      total: toNumber(order.total),
      paymentMethod: "COD",
      status: order.status,
      linkedToAccount: userId !== null,
    };
    return apiJson(body, { status: 201 });
  } catch (error) {
    if (error instanceof OrderCreationError) return apiError(request, 409, "orderUnavailable", { message: error.message });
    throw error;
  }
});
