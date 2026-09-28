// Mobile API: registration, sign-in, bearer tokens, revocation and
// password reset. See tests/mobile-api/helpers.ts for how to run.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { MOBILE_TOKEN_AUDIENCE, WEB_SESSION_AUDIENCE } from "../../src/lib/customer-token";
import {
  RUN,
  TEST_PASSWORD,
  call,
  cleanupRun,
  disconnect,
  expiredToken,
  nextIp,
  prisma,
  registerCustomer,
  testEmail,
  webSessionToken,
  websiteSessionStatus,
} from "./helpers";

after(async () => {
  await cleanupRun();
  await disconnect();
});

describe("POST /auth/register", () => {
  test("creates an account and returns an app session", async () => {
    const email = testEmail("reg");
    const res = await call("POST", "/auth/register", {
      body: { name: `MTest ${RUN} Reg`, email: email.toUpperCase(), phone: "01012345678", password: TEST_PASSWORD },
    });
    assert.equal(res.status, 201);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("x-dodana-api-version"), "1");
    assert.equal(res.body.tokenType, "Bearer");
    assert.match(res.body.token, /^[\w-]+\.[\w-]+\.[\w-]+$/);
    assert.ok(Date.parse(res.body.expiresAt) > Date.now() + 29 * 24 * 3600 * 1000);
    assert.deepEqual(Object.keys(res.body.customer).sort(), ["createdAt", "email", "id", "name", "phone"]);
    assert.equal(res.body.customer.email, email, "email is stored lower-cased, like the website");
    assert.equal(res.body.customer.phone, "01012345678");
    assert.ok(!JSON.stringify(res.body).includes("passwordHash"));

    const user = await prisma.user.findUnique({ where: { email } });
    assert.ok(user, "account exists in the shared users table");
    assert.notEqual(user.passwordHash, TEST_PASSWORD, "password is hashed");

    const me = await call("GET", "/me", { token: res.body.token });
    assert.equal(me.status, 200);
    assert.equal(me.body.customer.id, user.id);
  });

  test("rejects a duplicate email with 409 emailInUse", async () => {
    await registerCustomer("dup");
    const res = await call("POST", "/auth/register", {
      body: { name: "Someone", email: testEmail("dup"), password: TEST_PASSWORD },
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, "emailInUse");
    assert.deepEqual(res.body.error.fieldErrors, { email: "emailInUse" });
    assert.ok(res.body.error.message.length > 0);
  });

  test("validates input with per-field error codes", async () => {
    const res = await call("POST", "/auth/register", { body: { name: "A", email: "not-an-email", password: "short" } });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "invalidRequest");
    assert.ok(res.body.error.fieldErrors.email);
    assert.ok(res.body.error.fieldErrors.password);
    assert.ok(res.body.error.fieldErrors.name);
  });

  test("rejects a missing or malformed JSON body", async () => {
    assert.equal((await call("POST", "/auth/register")).status, 400);
    assert.equal((await call("POST", "/auth/register", { rawBody: "{not json" })).status, 400);
  });

  test("rejects an oversized body with 413", async () => {
    const res = await call("POST", "/auth/register", { rawBody: JSON.stringify({ name: "x".repeat(70 * 1024) }) });
    assert.equal(res.status, 413);
    assert.equal(res.body.error.code, "payloadTooLarge");
  });

  test("is rate limited per client IP (10 per hour)", async () => {
    const ip = nextIp();
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      // Invalid bodies still count, so no accounts are created.
      statuses.push((await call("POST", "/auth/register", { ip, body: {} })).status);
    }
    assert.deepEqual(statuses.slice(0, 10), Array(10).fill(400));
    assert.equal(statuses[10], 429);
  });
});

describe("POST /auth/login", () => {
  let email: string;
  before(async () => {
    email = (await registerCustomer("login")).email;
  });

  test("signs in with the website credentials", async () => {
    const res = await call("POST", "/auth/login", { body: { email, password: TEST_PASSWORD } });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.body.tokenType, "Bearer");
    assert.equal(res.body.customer.email, email);
    assert.equal((await call("GET", "/me", { token: res.body.token })).status, 200);
  });

  test("wrong password and unknown email give the same 401", async () => {
    const wrong = await call("POST", "/auth/login", { body: { email, password: "Wrong-password-1" } });
    const unknown = await call("POST", "/auth/login", { body: { email: testEmail("nobody"), password: TEST_PASSWORD } });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(wrong.body, unknown.body, "no account enumeration");
    assert.equal(wrong.body.error.code, "invalidCredentials");
  });

  test("localizes error messages (English default, Arabic on request)", async () => {
    const en = await call("POST", "/auth/login", { body: { email, password: "Wrong-password-1" } });
    const ar = await call("POST", "/auth/login", {
      body: { email, password: "Wrong-password-1" },
      headers: { "accept-language": "ar-EG,ar;q=0.9" },
    });
    const arParam = await call("POST", "/auth/login?locale=ar", { body: { email, password: "Wrong-password-1" } });
    assert.match(en.body.error.message, /[a-z]/i);
    assert.match(ar.body.error.message, /[؀-ۿ]/);
    assert.equal(arParam.body.error.message, ar.body.error.message);
  });

  test("is rate limited per IP and email (8 attempts per 15 minutes)", async () => {
    const ip = nextIp();
    const target = (await registerCustomer("ratelimit")).email;
    const statuses: number[] = [];
    for (let i = 0; i < 9; i++) {
      statuses.push((await call("POST", "/auth/login", { ip, body: { email: target, password: "Wrong-password-1" } })).status);
    }
    assert.deepEqual(statuses.slice(0, 8), Array(8).fill(401));
    assert.equal(statuses[8], 429);
    // Even the right password is refused while limited.
    const right = await call("POST", "/auth/login", { ip, body: { email: target, password: TEST_PASSWORD } });
    assert.equal(right.status, 429);
    assert.equal(right.body.error.code, "tooManyAttempts");
    assert.equal(right.body.token, undefined);
  });
});

describe("bearer tokens", () => {
  test("customer endpoints require a token", async () => {
    for (const [method, path] of [
      ["GET", "/me"],
      ["PATCH", "/me"],
      ["DELETE", "/me"],
      ["POST", "/me/password"],
      ["GET", "/me/cart"],
      ["PUT", "/me/cart"],
      ["GET", "/me/wishlist"],
      ["PUT", "/me/wishlist"],
      ["GET", "/me/orders"],
      ["GET", "/me/orders/DOD-000000"],
    ] as const) {
      const res = await call(method, path, method === "GET" ? {} : { body: {} });
      assert.equal(res.status, 401, `${method} ${path}`);
      assert.equal(res.body.error.code, "unauthorized", `${method} ${path}`);
      assert.equal(res.headers.get("cache-control"), "no-store");
    }
  });

  test("malformed Authorization headers are rejected", async () => {
    const session = await registerCustomer("malformed");
    for (const header of ["Bearer", "Bearer ", `Token ${session.token}`, `Bearer ${session.token} extra`, "Bearer a.b.c", `Bearer ${"a".repeat(5000)}`]) {
      const res = await call("GET", "/me", { headers: { authorization: header } });
      assert.equal(res.status, 401, header.slice(0, 40));
    }
  });

  test("a website session token is not accepted by the app API", async () => {
    const session = await registerCustomer("webtoken");
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.customer.id } });
    const web = await webSessionToken(user);
    assert.equal(await websiteSessionStatus(web), 200, "control: the website accepts its own session");
    assert.equal((await call("GET", "/me", { token: web })).status, 401);
  });

  test("an app token is not accepted as a website session", async () => {
    const session = await registerCustomer("apptoken");
    assert.equal(await websiteSessionStatus(session.token), 401);
  });

  test("an expired token is rejected", async () => {
    const session = await registerCustomer("expired");
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.customer.id } });
    assert.equal((await call("GET", "/me", { token: await expiredToken(user, MOBILE_TOKEN_AUDIENCE) })).status, 401);
    assert.equal(await websiteSessionStatus(await expiredToken(user, WEB_SESSION_AUDIENCE)), 401);
  });

  test("an app token gives no access to the admin API", async () => {
    const session = await registerCustomer("admin");
    for (const path of ["/api/admin/stats", "/api/admin/orders", "/api/admin/products", "/api/admin/settings"]) {
      const res = await call("GET", path, { token: session.token });
      assert.ok(res.status === 401 || res.status === 403, `${path} → ${res.status}`);
    }
  });
});

describe("POST /me/password", () => {
  test("changes the password, signs out every other session and returns a new token", async () => {
    const session = await registerCustomer("pw");
    const other = await call("POST", "/auth/login", { body: { email: session.email, password: TEST_PASSWORD } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.customer.id } });
    const web = await webSessionToken(user);
    assert.equal(await websiteSessionStatus(web), 200);

    const wrong = await call("POST", "/me/password", {
      token: session.token,
      body: { currentPassword: "Not-the-password-1", newPassword: "New-Mobile-Pass-2", confirm: "New-Mobile-Pass-2" },
    });
    assert.equal(wrong.status, 403);
    assert.equal(wrong.body.error.code, "currentPasswordWrong");

    const mismatch = await call("POST", "/me/password", {
      token: session.token,
      body: { currentPassword: TEST_PASSWORD, newPassword: "New-Mobile-Pass-2", confirm: "Different-Pass-3" },
    });
    assert.equal(mismatch.status, 400);
    assert.ok(mismatch.body.error.fieldErrors.confirm);

    const res = await call("POST", "/me/password", {
      token: session.token,
      body: { currentPassword: TEST_PASSWORD, newPassword: "New-Mobile-Pass-2", confirm: "New-Mobile-Pass-2" },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.tokenType, "Bearer");
    assert.notEqual(res.body.token, session.token);

    assert.equal((await call("GET", "/me", { token: session.token })).status, 401, "old app token revoked");
    assert.equal((await call("GET", "/me", { token: other.body.token })).status, 401, "other device revoked");
    assert.equal(await websiteSessionStatus(web), 401, "website session revoked");
    assert.equal((await call("GET", "/me", { token: res.body.token })).status, 200, "new token works");

    assert.equal((await call("POST", "/auth/login", { body: { email: session.email, password: TEST_PASSWORD } })).status, 401);
    assert.equal((await call("POST", "/auth/login", { body: { email: session.email, password: "New-Mobile-Pass-2" } })).status, 200);
  });
});

describe("POST /auth/forgot-password", () => {
  test("emails a website reset link for a real account, with the same answer for unknown emails", async () => {
    const session = await registerCustomer("forgot");
    const known = await call("POST", "/auth/forgot-password", { body: { email: session.email } });
    const unknown = await call("POST", "/auth/forgot-password", { body: { email: testEmail("forgot-nobody") } });
    assert.equal(known.status, 200);
    assert.deepEqual(known.body, unknown.body, "no account enumeration");
    assert.equal(known.body.code, "resetEmailSent");

    const tokens = await prisma.passwordResetToken.findMany({ where: { userId: session.customer.id } });
    assert.equal(tokens.length, 1, "a reset token is stored (hashed) for the website's reset page");
    assert.match(tokens[0]!.tokenHash, /^[0-9a-f]{64}$/);
    assert.ok(tokens[0]!.expiresAt.getTime() > Date.now());
  });

  test("answers in Arabic when asked", async () => {
    const res = await call("POST", "/auth/forgot-password?locale=ar", { body: { email: testEmail("forgot-ar") } });
    assert.equal(res.status, 200);
    assert.match(res.body.message, /[؀-ۿ]/);
  });

  test("validates the email", async () => {
    const res = await call("POST", "/auth/forgot-password", { body: { email: "nope" } });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.fieldErrors.email, "invalidEmail");
  });
});
