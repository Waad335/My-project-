import { requireMobileCustomer } from "@/lib/mobile/auth";
import { listCustomerOrders } from "@/lib/mobile/orders";
import { apiJson, mobileRoute } from "@/lib/mobile/http";
import type { OrdersResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// The customer's orders, newest first.
export const GET = mobileRoute(async (request) => {
  const auth = await requireMobileCustomer(request);
  if (auth.response) return auth.response;
  const body: OrdersResponse = { orders: await listCustomerOrders(auth.customer.id) };
  return apiJson(body);
});
