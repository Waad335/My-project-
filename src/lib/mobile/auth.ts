import { customerForClaims, type CurrentCustomer } from "@/lib/customer-auth";
import {
  CUSTOMER_SESSION_MAX_AGE_SECONDS,
  MOBILE_TOKEN_AUDIENCE,
  signCustomerToken,
  verifyCustomerToken,
} from "@/lib/customer-token";
import { apiError } from "@/lib/mobile/http";
import type { MobileCustomer, TokenResponse } from "@/lib/mobile/types";

// Mobile app authentication: the same customer accounts, passwords and
// sessionVersion revocation as the website, carried as a bearer token
// (Authorization: Bearer <token>) instead of a cookie. App tokens use their
// own audience, so a website session cookie is rejected here and an app
// token is rejected by the website.

const MAX_TOKEN_LENGTH = 4096;

export async function issueMobileToken(user: { id: string; sessionVersion: number }): Promise<TokenResponse> {
  const token = await signCustomerToken(user, MOBILE_TOKEN_AUDIENCE);
  return {
    token,
    tokenType: "Bearer",
    expiresAt: new Date(Date.now() + CUSTOMER_SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
  };
}

// The raw token from "Authorization: Bearer <token>", "" when the header is
// present but malformed, or null when there is no Authorization header.
function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header === null) return null;
  const match = /^Bearer ([A-Za-z0-9._~+/=-]+)$/.exec(header.trim());
  if (!match || match[1]!.length > MAX_TOKEN_LENGTH) return "";
  return match[1]!;
}

export type MobileAuth =
  | { status: "guest" }
  | { status: "invalid" }
  | { status: "customer"; customer: CurrentCustomer };

// guest: no Authorization header. invalid: a header was sent but the token
// is malformed, expired, for another audience, for a deleted account, or
// predates the latest password change — the app should sign in again.
export async function authenticateMobileRequest(request: Request): Promise<MobileAuth> {
  const token = bearerToken(request);
  if (token === null) return { status: "guest" };
  if (!token) return { status: "invalid" };
  const claims = await verifyCustomerToken(token, MOBILE_TOKEN_AUDIENCE);
  if (!claims) return { status: "invalid" };
  const customer = await customerForClaims(claims);
  return customer ? { status: "customer", customer } : { status: "invalid" };
}

// For endpoints that need a signed-in customer: the customer, or a 401.
export async function requireMobileCustomer(
  request: Request
): Promise<{ customer: CurrentCustomer; response?: never } | { customer?: never; response: Response }> {
  const auth = await authenticateMobileRequest(request);
  if (auth.status !== "customer") return { response: apiError(request, 401, "unauthorized") };
  return { customer: auth.customer };
}

export function toMobileCustomer(customer: CurrentCustomer): MobileCustomer {
  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    createdAt: customer.createdAt.toISOString(),
  };
}
