import { cache } from "react";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Storefront customer sessions. Kept entirely separate from the admin
// NextAuth session: different cookie, different (derived) signing key, and
// explicit issuer/audience claims — the admin middleware only checks that a
// NextAuth token exists, so customers must never be able to obtain one.
export const CUSTOMER_COOKIE = "dodana_session";
const ISSUER = "dodana-storefront";
const AUDIENCE = "dodana-customer";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function signingKey(): Uint8Array {
  const secret = process.env.CUSTOMER_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("CUSTOMER_AUTH_SECRET (or NEXTAUTH_SECRET) must be set for customer accounts.");
  return new Uint8Array(createHash("sha256").update(`dodana-customer-session:${secret}`).digest());
}

export type CurrentCustomer = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  createdAt: Date;
};

export async function createCustomerSession(user: { id: string; sessionVersion: number }) {
  const token = await new SignJWT({ sv: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(signingKey());

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

  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, phone: true, createdAt: true, sessionVersion: true },
    });
    if (!user || user.sessionVersion !== payload.sv) return null;

    return { id: user.id, email: user.email, name: user.name, phone: user.phone, createdAt: user.createdAt };
  } catch {
    return null;
  }
});

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
