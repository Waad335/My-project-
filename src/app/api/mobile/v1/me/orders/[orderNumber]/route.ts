import { requireMobileCustomer } from "@/lib/mobile/auth";
import { getCustomerOrder } from "@/lib/mobile/orders";
import { apiError, apiJson, mobileRoute } from "@/lib/mobile/http";
import type { OrderResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// One of the customer's own orders; anyone else's order number is "not found".
export const GET = mobileRoute(async (request, { params }) => {
  const auth = await requireMobileCustomer(request);
  if (auth.response) return auth.response;
  const order = await getCustomerOrder(auth.customer.id, (params.orderNumber ?? "").trim().toUpperCase());
  if (!order) return apiError(request, 404, "notFound");
  const body: OrderResponse = { order };
  return apiJson(body);
});
