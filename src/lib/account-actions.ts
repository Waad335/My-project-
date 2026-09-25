"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clearCustomerSession,
  createCustomerSession,
  getCurrentCustomer,
  safeNextPath,
} from "@/lib/customer-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { passwordResetEmail, sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation";

// Messages are translation keys in the "account" namespace.
export type AccountFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const BCRYPT_ROUNDS = 12;
const RESET_TTL_MS = 60 * 60 * 1000;
// Compared against when an email isn't registered, so a failed login takes
// the same time either way (no account enumeration via timing).
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKxGhuYx7p2J5E3Q6uGv2vYz7c1jQ0f0Qm1bK";

function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function registerAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  if (!rateLimit(`register:${clientIp()}`, 10, 60 * 60 * 1000)) return { status: "error", message: "tooManyAttempts" };

  const parsed = registerSchema.safeParse({
    name: field(formData, "name"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    password: field(formData, "password"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return { status: "error", fieldErrors: { email: "emailInUse" } };

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      passwordHash: await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS),
    },
    select: { id: true, sessionVersion: true },
  });
  await createCustomerSession(user);
  redirect(safeNextPath(field(formData, "next")));
}

export async function loginAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const parsed = loginSchema.safeParse({ email: field(formData, "email"), password: field(formData, "password") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const ip = clientIp();
  if (!rateLimit(`login:${ip}`, 20, 15 * 60 * 1000) || !rateLimit(`login:${ip}:${parsed.data.email}`, 8, 15 * 60 * 1000)) {
    return { status: "error", message: "tooManyAttempts" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true, sessionVersion: true },
  });
  const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { status: "error", message: "invalidCredentials" };

  await createCustomerSession(user);
  redirect(safeNextPath(field(formData, "next")));
}

export async function logoutAction(): Promise<void> {
  clearCustomerSession();
}

export async function forgotPasswordAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: field(formData, "email") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  if (!rateLimit(`forgot:${clientIp()}`, 5, 60 * 60 * 1000)) return { status: "error", message: "tooManyAttempts" };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });

  // Same response whether or not the address has an account.
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
      }),
    ]);
    const locale = await getLocale();
    const link = `${SITE_URL}/account/reset-password?token=${token}`;
    const email = passwordResetEmail(link, user.name, locale);
    await sendEmail({ to: user.email, ...email });
  }

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

  const parsed = profileSchema.safeParse({ name: field(formData, "name"), phone: field(formData, "phone") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  await prisma.user.update({
    where: { id: customer.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });
  return { status: "success", message: "profileSaved" };
}

export async function changePasswordAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");
  if (!rateLimit(`change-password:${customer.id}`, 8, 15 * 60 * 1000)) return { status: "error", message: "tooManyAttempts" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: field(formData, "currentPassword"),
    newPassword: field(formData, "newPassword"),
    confirm: field(formData, "confirm"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const user = await prisma.user.findUnique({ where: { id: customer.id }, select: { passwordHash: true } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { status: "error", fieldErrors: { currentPassword: "currentPasswordWrong" } };
  }

  const updated = await prisma.user.update({
    where: { id: customer.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS), sessionVersion: { increment: 1 } },
    select: { id: true, sessionVersion: true },
  });
  // Other devices are signed out; this one gets a fresh session.
  await createCustomerSession(updated);
  return { status: "success", message: "passwordChanged" };
}
