import { customerForClaims } from "@/lib/customer-auth";
import { registerCustomer } from "@/lib/customer-accounts";
import { clientIp } from "@/lib/rate-limit";
import { issueMobileToken, toMobileCustomer } from "@/lib/mobile/auth";
import { accountFailure, apiError, apiJson, isRecord, mobileRoute, readJson } from "@/lib/mobile/http";
import type { AuthSessionResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// Creates a customer account (the same accounts the website uses) and
// signs the app in. Body: { name, email, phone?, password }.
export const POST = mobileRoute(async (request) => {
  const read = await readJson(request);
  if ("response" in read) return read.response;
  const body = isRecord(read.body) ? read.body : {};

  const result = await registerCustomer(
    { ip: clientIp() },
    { name: body.name, email: body.email, phone: body.phone ?? "", password: body.password }
  );
  if (!result.ok) return accountFailure(request, result);

  const customer = await customerForClaims({ userId: result.value.id, sessionVersion: result.value.sessionVersion });
  if (!customer) return apiError(request, 500, "serverError");
  const session: AuthSessionResponse = { ...(await issueMobileToken(result.value)), customer: toMobileCustomer(customer) };
  return apiJson(session, { status: 201 });
});
