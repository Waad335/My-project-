// Unit tests for customer session tokens (src/lib/customer-token.ts): the
// website's cookie session and the mobile app's bearer token share a key,
// issuer and claims but must never be interchangeable.
// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { SignJWT, UnsecuredJWT } from "jose";
import {
  CUSTOMER_TOKEN_ISSUER,
  MOBILE_TOKEN_AUDIENCE,
  WEB_SESSION_AUDIENCE,
  signCustomerToken,
  verifyCustomerToken,
} from "../../src/lib/customer-token";

const SECRET = "unit-test-secret-not-used-anywhere-else";
process.env.CUSTOMER_AUTH_SECRET = SECRET;

const user = { id: "user_123", sessionVersion: 4 };

// The key derivation the module documents, so hand-built tokens below are
// signed exactly like real ones except for the one property under test.
function keyFor(secret: string) {
  return new Uint8Array(createHash("sha256").update(`dodana-customer-session:${secret}`).digest());
}

function baseToken(claims: Record<string, unknown> = { sv: user.sessionVersion }) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(CUSTOMER_TOKEN_ISSUER)
    .setIssuedAt();
}

test("a website session token round-trips", async () => {
  const token = await signCustomerToken(user, WEB_SESSION_AUDIENCE);
  assert.deepEqual(await verifyCustomerToken(token, WEB_SESSION_AUDIENCE), {
    userId: user.id,
    sessionVersion: user.sessionVersion,
  });
});

test("a mobile app token round-trips", async () => {
  const token = await signCustomerToken(user, MOBILE_TOKEN_AUDIENCE);
  assert.deepEqual(await verifyCustomerToken(token, MOBILE_TOKEN_AUDIENCE), {
    userId: user.id,
    sessionVersion: user.sessionVersion,
  });
});

test("a website session token is not accepted as a mobile token", async () => {
  const token = await signCustomerToken(user, WEB_SESSION_AUDIENCE);
  assert.equal(await verifyCustomerToken(token, MOBILE_TOKEN_AUDIENCE), null);
});

test("a mobile token is not accepted as a website session", async () => {
  const token = await signCustomerToken(user, MOBILE_TOKEN_AUDIENCE);
  assert.equal(await verifyCustomerToken(token, WEB_SESSION_AUDIENCE), null);
});

test("tokens expire after 30 days by default", async () => {
  const token = await signCustomerToken(user, MOBILE_TOKEN_AUDIENCE);
  const payload = JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString());
  assert.equal(payload.exp - payload.iat, 60 * 60 * 24 * 30);
  assert.equal(payload.sub, user.id);
  assert.equal(payload.iss, CUSTOMER_TOKEN_ISSUER);
  assert.equal(payload.aud, MOBILE_TOKEN_AUDIENCE);
  assert.equal(payload.sv, user.sessionVersion);
});

test("an expired token is rejected", async () => {
  const token = await baseToken()
    .setAudience(MOBILE_TOKEN_AUDIENCE)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .sign(keyFor(SECRET));
  assert.equal(await verifyCustomerToken(token, MOBILE_TOKEN_AUDIENCE), null);
});

test("a hand-built token with the right key and claims is accepted (control)", async () => {
  const token = await baseToken().setAudience(MOBILE_TOKEN_AUDIENCE).setExpirationTime("1h").sign(keyFor(SECRET));
  assert.deepEqual(await verifyCustomerToken(token, MOBILE_TOKEN_AUDIENCE), {
    userId: user.id,
    sessionVersion: user.sessionVersion,
  });
});

test("a token signed with another secret is rejected", async () => {
  const token = await baseToken().setAudience(MOBILE_TOKEN_AUDIENCE).setExpirationTime("1h").sign(keyFor("other-secret"));
  assert.equal(await verifyCustomerToken(token, MOBILE_TOKEN_AUDIENCE), null);
});

test("a token from another issuer is rejected", async () => {
  const token = await baseToken()
    .setIssuer("someone-else")
    .setAudience(MOBILE_TOKEN_AUDIENCE)
    .setExpirationTime("1h")
    .sign(keyFor(SECRET));
  assert.equal(await verifyCustomerToken(token, MOBILE_TOKEN_AUDIENCE), null);
});

test("a tampered payload is rejected", async () => {
  const token = await signCustomerToken(user, MOBILE_TOKEN_AUDIENCE);
  const [header, payload, signature] = token.split(".");
  const claims = JSON.parse(Buffer.from(payload!, "base64url").toString());
  claims.sub = "someone_else";
  const forged = [header, Buffer.from(JSON.stringify(claims)).toString("base64url"), signature].join(".");
  assert.equal(await verifyCustomerToken(forged, MOBILE_TOKEN_AUDIENCE), null);
});

test("an unsigned (alg: none) token is rejected", async () => {
  const token = new UnsecuredJWT({ sv: user.sessionVersion })
    .setSubject(user.id)
    .setIssuer(CUSTOMER_TOKEN_ISSUER)
    .setAudience(MOBILE_TOKEN_AUDIENCE)
    .setExpirationTime("1h")
    .encode();
  assert.equal(await verifyCustomerToken(token, MOBILE_TOKEN_AUDIENCE), null);
});

test("a token without a numeric session version is rejected", async () => {
  const missing = await baseToken({}).setAudience(MOBILE_TOKEN_AUDIENCE).setExpirationTime("1h").sign(keyFor(SECRET));
  const text = await baseToken({ sv: "4" }).setAudience(MOBILE_TOKEN_AUDIENCE).setExpirationTime("1h").sign(keyFor(SECRET));
  assert.equal(await verifyCustomerToken(missing, MOBILE_TOKEN_AUDIENCE), null);
  assert.equal(await verifyCustomerToken(text, MOBILE_TOKEN_AUDIENCE), null);
});

test("garbage is rejected without throwing", async () => {
  for (const token of ["", "abc", "a.b.c", "Bearer x"]) {
    assert.equal(await verifyCustomerToken(token, MOBILE_TOKEN_AUDIENCE), null, token);
  }
});

test("signing refuses to run without a configured secret", async () => {
  const saved = { c: process.env.CUSTOMER_AUTH_SECRET, n: process.env.NEXTAUTH_SECRET };
  delete process.env.CUSTOMER_AUTH_SECRET;
  delete process.env.NEXTAUTH_SECRET;
  try {
    await assert.rejects(signCustomerToken(user, MOBILE_TOKEN_AUDIENCE), /CUSTOMER_AUTH_SECRET/);
  } finally {
    process.env.CUSTOMER_AUTH_SECRET = saved.c;
    if (saved.n !== undefined) process.env.NEXTAUTH_SECRET = saved.n;
  }
});
