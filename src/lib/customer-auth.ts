import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  CUSTOMER_SESSION_MAX_AGE_SECONDS,
  WEB_SESSION_AUDIENCE,
  signCustomerToken,
  verifyCustomerToken,
  type CustomerTokenClaims,
} from "@/lib/customer-token";

// Storefront customer sessions. Kept entirely separate from the admin
// NextAuth session: different cookie, different (derived) signing key, and
// explicit issuer/audience claims — the admin middleware only checks that a
// NextAuth token exists, so customers must never be able to obtain one.
// Token signing/verification lives in src/lib/customer-token.ts (shared
// with the mobile app's bearer tokens, which use a different audience).
export const CUSTOMER_COOKIE = "dodana_session";
const MAX_AGE_SECONDS = CUSTOMER_SESSION_MAX_AGE_SECONDS;

export type CurrentCustomer = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  createdAt: Date;
};

export async function createCustomerSession(user: { id: string; sessionVersion: number }) {
  const token = await signCustomerToken(user, WEB_SESSION_AUDIENCE, MAX_AGE_SECONDS);

  cookies().set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearCustomerSession() {
  cookies().set(CUSTOMER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// cache(): the root layout, header and account pages all ask for the current
// customer during one render — this keeps it to a single DB lookup, and to
// zero lookups for guests (no cookie).
export const getCurrentCustomer = cache(async (): Promise<CurrentCustomer | null> => {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifyCustomerToken(token, WEB_SESSION_AUDIENCE);
  if (!claims) return null;
  return customerForClaims(claims);
});

// The customer a verified token belongs to — null if the account no longer
// exists or the token predates the latest password change/reset.
export async function customerForClaims(claims: CustomerTokenClaims): Promise<CurrentCustomer | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: claims.userId },
      select: { id: true, email: true, name: true, phone: true, createdAt: true, sessionVersion: true },
    });
    if (!user || user.sessionVersion !== claims.sessionVersion) return null;

    return { id: user.id, email: user.email, name: user.name, phone: user.phone, createdAt: user.createdAt };
  } catch {
    return null;
  }
}

// Only same-site relative paths are accepted as post-login destinations, so
// ?next= can't be used as an open redirect.
export function safeNextPath(value: FormDataEntryValue | string | null | undefined, fallback = "/account") {
  if (typeof value !== "string") return fallback;
  // Same-origin relative path only: no scheme-relative "//", no backslashes
  // (some browsers treat "/\\" as "//"), no whitespace/control characters.
  if (!/^\/(?![\/\\])[^\s\\]*$/.test(value)) return fallback;
  return value;
}

// For account pages: the signed-in customer, or a redirect to sign-in that
// returns here afterwards.
export async function requireCustomer(returnTo: string): Promise<CurrentCustomer> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/account/login?next=${encodeURIComponent(returnTo)}`);
  return customer;
}
