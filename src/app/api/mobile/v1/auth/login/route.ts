import { customerForClaims } from "@/lib/customer-auth";
import { authenticateCustomer } from "@/lib/customer-accounts";
import { clientIp } from "@/lib/rate-limit";
import { issueMobileToken, toMobileCustomer } from "@/lib/mobile/auth";
import { accountFailure, apiError, apiJson, isRecord, mobileRoute, readJson } from "@/lib/mobile/http";
import type { AuthSessionResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// Signs the app in with the customer's website email and password.
// Body: { email, password }. Sign-out is client-side (discard the token);
// changing the password signs out every device.
export const POST = mobileRoute(async (request) => {
  const read = await readJson(request);
  if ("response" in read) return read.response;
  const body = isRecord(read.body) ? read.body : {};

  const result = await authenticateCustomer({ ip: clientIp() }, { email: body.email, password: body.password });
  if (!result.ok) return accountFailure(request, result);

  const customer = await customerForClaims({ userId: result.value.id, sessionVersion: result.value.sessionVersion });
  if (!customer) return apiError(request, 500, "serverError");
  const session: AuthSessionResponse = { ...(await issueMobileToken(result.value)), customer: toMobileCustomer(customer) };
  return apiJson(session);
});
