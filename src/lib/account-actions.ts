"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  clearCustomerSession,
  createCustomerSession,
  getCurrentCustomer,
  safeNextPath,
} from "@/lib/customer-auth";
import {
  BCRYPT_ROUNDS,
  authenticateCustomer,
  changeCustomerPassword,
  fieldErrors,
  hashToken,
  registerCustomer,
  requestPasswordReset,
  updateCustomerProfile,
  type AccountFailure,
} from "@/lib/customer-accounts";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validation";

// Website form actions for customer accounts. The account logic itself
// lives in src/lib/customer-accounts.ts (shared with the mobile API); these
// wrappers only read the form, set the session cookie and redirect.

// Messages are translation keys in the "account" namespace.
export type AccountFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function failure(result: AccountFailure): AccountFormState {
  if (result.fieldErrors) return { status: "error", fieldErrors: result.fieldErrors };
  return { status: "error", message: result.message };
}

export async function registerAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const result = await registerCustomer(
    { ip: clientIp() },
    {
      name: field(formData, "name"),
      email: field(formData, "email"),
      phone: field(formData, "phone"),
      password: field(formData, "password"),
    }
  );
  if (!result.ok) return failure(result);

  await createCustomerSession(result.value);
  redirect(safeNextPath(field(formData, "next")));
}

export async function loginAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const result = await authenticateCustomer(
    { ip: clientIp() },
    { email: field(formData, "email"), password: field(formData, "password") }
  );
  if (!result.ok) return failure(result);

  await createCustomerSession(result.value);
  redirect(safeNextPath(field(formData, "next")));
}

export async function logoutAction(): Promise<void> {
  clearCustomerSession();
}

export async function forgotPasswordAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const result = await requestPasswordReset(
    { ip: clientIp(), resolveLocale: () => getLocale() },
    { email: field(formData, "email") }
  );
  if (!result.ok) return failure(result);

  return { status: "success", message: "resetEmailSent" };
}

export async function resetPasswordAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: field(formData, "token"),
    password: field(formData, "password"),
    confirm: field(formData, "confirm"),
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    if (errors.token) return { status: "error", message: "resetLinkInvalid" };
    return { status: "error", fieldErrors: errors };
  }
  if (!rateLimit(`reset:${clientIp()}`, 10, 60 * 60 * 1000)) return { status: "error", message: "tooManyAttempts" };

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) return { status: "error", message: "resetLinkInvalid" };

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
  const [user] = await prisma.$transaction([
    // Bumping sessionVersion signs out every existing session.
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
      select: { id: true, sessionVersion: true },
    }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);
  await createCustomerSession(user);
  redirect("/account?reset=1");
}

export async function updateProfileAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  const result = await updateCustomerProfile(customer.id, { name: field(formData, "name"), phone: field(formData, "phone") });
  if (!result.ok) return failure(result);

  return { status: "success", message: "profileSaved" };
}

export async function changePasswordAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  const result = await changeCustomerPassword(customer.id, {
    currentPassword: field(formData, "currentPassword"),
    newPassword: field(formData, "newPassword"),
    confirm: field(formData, "confirm"),
  });
  if (!result.ok) return failure(result);

  // Other devices are signed out; this one gets a fresh session.
  await createCustomerSession(result.value);
  return { status: "success", message: "passwordChanged" };
}
