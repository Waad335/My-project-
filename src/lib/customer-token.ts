import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

// Signing and verification of storefront customer session tokens, shared by
// the website's cookie session (src/lib/customer-auth.ts) and the mobile
// app's bearer tokens (src/lib/mobile/auth.ts). Dependency-free apart from
// jose so it can be unit-tested outside Next.js.
//
// Both kinds of token use the same key, issuer, subject (the user id) and
// `sv` (User.sessionVersion) claim, but a different audience, so a website
// cookie can't be used as an app token and vice versa. Revocation is the
// same for both: bumping User.sessionVersion (password change/reset)
// invalidates every token issued before it.

export const CUSTOMER_TOKEN_ISSUER = "dodana-storefront";
export const WEB_SESSION_AUDIENCE = "dodana-customer";
export const MOBILE_TOKEN_AUDIENCE = "dodana-customer-mobile";
export const CUSTOMER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type CustomerTokenAudience = typeof WEB_SESSION_AUDIENCE | typeof MOBILE_TOKEN_AUDIENCE;

export type CustomerTokenClaims = { userId: string; sessionVersion: number };

function signingKey(): Uint8Array {
  const secret = process.env.CUSTOMER_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("CUSTOMER_AUTH_SECRET (or NEXTAUTH_SECRET) must be set for customer accounts.");
  return new Uint8Array(createHash("sha256").update(`dodana-customer-session:${secret}`).digest());
}

export async function signCustomerToken(
  user: { id: string; sessionVersion: number },
  audience: CustomerTokenAudience,
  maxAgeSeconds = CUSTOMER_SESSION_MAX_AGE_SECONDS
): Promise<string> {
  return new SignJWT({ sv: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(CUSTOMER_TOKEN_ISSUER)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(signingKey());
}

// Signature, issuer, audience and expiry only. Callers must still check the
// user exists and that `sessionVersion` matches the database.
export async function verifyCustomerToken(token: string, audience: CustomerTokenAudience): Promise<CustomerTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      issuer: CUSTOMER_TOKEN_ISSUER,
      audience,
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.sv !== "number") return null;
    return { userId: payload.sub, sessionVersion: payload.sv };
  } catch {
    return null;
  }
}
