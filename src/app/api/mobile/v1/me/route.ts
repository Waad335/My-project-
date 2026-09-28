import { customerForClaims } from "@/lib/customer-auth";
import { deleteCustomerAccount, updateCustomerProfile } from "@/lib/customer-accounts";
import { requireMobileCustomer, toMobileCustomer } from "@/lib/mobile/auth";
import { accountFailure, apiError, apiJson, isRecord, mobileRoute, readJson } from "@/lib/mobile/http";
import type { AccountDeletedResponse, MeResponse } from "@/lib/mobile/types";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// The signed-in customer's profile.
export const GET = mobileRoute(async (request) => {
  const auth = await requireMobileCustomer(request);
  if (auth.response) return auth.response;
  const body: MeResponse = { customer: toMobileCustomer(auth.customer) };
  return apiJson(body);
});

// Updates name and phone. Body: { name, phone? }.
export const PATCH = mobileRoute(async (request) => {
  const auth = await requireMobileCustomer(request);
  if (auth.response) return auth.response;
  const read = await readJson(request);
  if ("response" in read) return read.response;
  const input = isRecord(read.body) ? read.body : {};

  const result = await updateCustomerProfile(auth.customer.id, { name: input.name, phone: input.phone ?? "" });
  if (!result.ok) return accountFailure(request, result);

  const user = await prisma.user.findUnique({ where: { id: auth.customer.id }, select: { sessionVersion: true } });
  const updated = user && (await customerForClaims({ userId: auth.customer.id, sessionVersion: user.sessionVersion }));
  if (!updated) return apiError(request, 500, "serverError");
  const body: MeResponse = { customer: toMobileCustomer(updated) };
  return apiJson(body);
});

// Deletes the account (see docs/mobile/account-deletion.md). Confirmed
// with the current password. Body: { password }.
export const DELETE = mobileRoute(async (request) => {
  const auth = await requireMobileCustomer(request);
  if (auth.response) return auth.response;
  const read = await readJson(request);
  if ("response" in read) return read.response;
  const input = isRecord(read.body) ? read.body : {};

  const result = await deleteCustomerAccount(auth.customer.id, { password: input.password });
  if (!result.ok) return accountFailure(request, result);

  const body: AccountDeletedResponse = { deleted: true, ordersRetained: result.value.ordersRetained };
  return apiJson(body);
});
