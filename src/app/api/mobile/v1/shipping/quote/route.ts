import { z } from "zod";
import { getShippingQuote } from "@/lib/shipping";
import { apiError, apiJson, mobileRoute, readJson } from "@/lib/mobile/http";
import type { ShippingQuoteResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

const schema = z.object({ governorate: z.string().trim().min(2).max(100), subtotal: z.number().min(0).max(10_000_000) });

// The shipping fee checkout will charge for a governorate and subtotal
// (free-shipping threshold included) — the same calculation as checkout.
export const POST = mobileRoute(async (request) => {
  const read = await readJson(request);
  if ("response" in read) return read.response;
  const parsed = schema.safeParse(read.body);
  if (!parsed.success) return apiError(request, 400, "invalidRequest");
  const quote: ShippingQuoteResponse = await getShippingQuote(parsed.data.governorate, parsed.data.subtotal);
  return apiJson(quote);
});
