import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { passwordResetEmail, sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import {
  changePasswordSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
} from "@/lib/validation";

// Storefront customer-account operations, shared by the website's server
// actions (src/lib/account-actions.ts) and the mobile API
// (src/app/api/mobile/v1/**). Each function applies the same validation,
// rate limits (same keys, so attempts from the website and the app count
// together) and database writes; callers only deal with transport —
// cookies/redirects on the website, bearer tokens/JSON in the app.
//
// Failure messages and field errors are translation keys in the "account"
// namespace of src/messages/*.json.

export const BCRYPT_ROUNDS = 12;
export const RESET_TTL_MS = 60 * 60 * 1000;
// Compared against when an email isn't registered, so a failed login takes
// the same time either way (no account enumeration via timing).
export const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKxGhuYx7p2J5E3Q6uGv2vYz7c1jQ0f0Qm1bK";

export type AccountFailure = { ok: false; message?: string; fieldErrors?: Record<string, string> };
export type AccountResult<T> = { ok: true; value: T } | AccountFailure;
type SessionUser = { id: string; sessionVersion: number };

export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const tooManyAttempts: AccountFailure = { ok: false, message: "tooManyAttempts" };

export async function registerCustomer(
  ctx: { ip: string },
  input: { name: unknown; email: unknown; phone: unknown; password: unknown }
): Promise<AccountResult<SessionUser>> {
  if (!rateLimit(`register:${ctx.ip}`, 10, 60 * 60 * 1000)) return tooManyAttempts;

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return { ok: false, fieldErrors: { email: "emailInUse" } };

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      passwordHash: await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS),
    },
    select: { id: true, sessionVersion: true },
  });
  return { ok: true, value: user };
}

export async function authenticateCustomer(
  ctx: { ip: string },
  input: { email: unknown; password: unknown }
): Promise<AccountResult<SessionUser>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  if (!rateLimit(`login:${ctx.ip}`, 20, 15 * 60 * 1000) || !rateLimit(`login:${ctx.ip}:${parsed.data.email}`, 8, 15 * 60 * 1000)) {
    return tooManyAttempts;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true, sessionVersion: true },
  });
  const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { ok: false, message: "invalidCredentials" };

  return { ok: true, value: { id: user.id, sessionVersion: user.sessionVersion } };
}

// Emails a reset link to the website's reset page. Succeeds whether or not
// the address has an account (no enumeration).
export async function requestPasswordReset(
  ctx: { ip: string; resolveLocale: () => Promise<string> },
  input: { email: unknown }
): Promise<AccountResult<void>> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  if (!rateLimit(`forgot:${ctx.ip}`, 5, 60 * 60 * 1000)) return tooManyAttempts;

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    const token = randomBytes(32).toString("base64url");
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
      }),
    ]);
    const locale = await ctx.resolveLocale();
    const link = `${SITE_URL}/account/reset-password?token=${token}`;
    const email = passwordResetEmail(link, user.name, locale);
    await sendEmail({ to: user.email, ...email });
  }

  return { ok: true, value: undefined };
}

export async function updateCustomerProfile(userId: string, input: { name: unknown; phone: unknown }): Promise<AccountResult<void>> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });
  return { ok: true, value: undefined };
}

// Bumps sessionVersion, which signs out every other session and app token;
// the caller issues a fresh session/token from the returned user.
export async function changeCustomerPassword(
  userId: string,
  input: { currentPassword: unknown; newPassword: unknown; confirm: unknown }
): Promise<AccountResult<SessionUser>> {
  if (!rateLimit(`change-password:${userId}`, 8, 15 * 60 * 1000)) return tooManyAttempts;

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { ok: false, fieldErrors: { currentPassword: "currentPasswordWrong" } };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS), sessionVersion: { increment: 1 } },
    select: { id: true, sessionVersion: true },
  });
  return { ok: true, value: updated };
}

// Account deletion (see docs/mobile/account-deletion.md for the retention
// policy). Requires the current password. In one transaction:
//  - past orders are kept for business/accounting records, but their link
//    to the account (Order.userId) is removed — each order keeps only the
//    delivery details captured at checkout, like a guest order;
//  - the newsletter subscription for the account's email is removed;
//  - the user row is deleted, which also deletes the saved wishlist, saved
//    cart and any password-reset tokens (ON DELETE CASCADE).
// Every session and app token stops working because the user no longer
// exists.
export async function deleteCustomerAccount(
  userId: string,
  input: { password: unknown }
): Promise<AccountResult<{ ordersRetained: number }>> {
  if (!rateLimit(`delete-account:${userId}`, 5, 15 * 60 * 1000)) return tooManyAttempts;

  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, passwordHash: true } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { ok: false, fieldErrors: { password: "currentPasswordWrong" } };
  }

  const [detached] = await prisma.$transaction([
    prisma.order.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.newsletterSubscriber.deleteMany({ where: { email: user.email } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  return { ok: true, value: { ordersRetained: detached.count } };
}
