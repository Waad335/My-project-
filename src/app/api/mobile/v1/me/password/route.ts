import { changeCustomerPassword } from "@/lib/customer-accounts";
import { issueMobileToken, requireMobileCustomer } from "@/lib/mobile/auth";
import { accountFailure, apiJson, isRecord, mobileRoute, readJson } from "@/lib/mobile/http";

export const dynamic = "force-dynamic";

// Changes the password. Every other session and app token is signed out;
// this app gets a fresh token. Body: { currentPassword, newPassword, confirm }.
export const POST = mobileRoute(async (request) => {
  const auth = await requireMobileCustomer(request);
  if (auth.response) return auth.response;
  const read = await readJson(request);
  if ("response" in read) return read.response;
  const input = isRecord(read.body) ? read.body : {};

  const result = await changeCustomerPassword(auth.customer.id, {
    currentPassword: input.currentPassword,
    newPassword: input.newPassword,
    confirm: input.confirm,
  });
  if (!result.ok) return accountFailure(request, result);

  return apiJson(await issueMobileToken(result.value));
});
