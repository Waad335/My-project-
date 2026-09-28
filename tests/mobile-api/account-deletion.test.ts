// Mobile API: DELETE /me — account deletion and what is retained
// (see docs/mobile/account-deletion.md). See tests/mobile-api/helpers.ts
// for how to run.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  type CatalogFixture,
  RUN,
  activeShippingZone,
  assertServerUsesTestDatabase,
  call,
  checkoutBody,
  cleanupRun,
  createCatalogFixture,
  disconnect,
  prisma,
  registerCustomer,
  webSessionToken,
  websiteSessionStatus,
} from "./helpers";

let fx: CatalogFixture;

before(async () => {
  fx = await createCatalogFixture();
  await assertServerUsesTestDatabase(fx);
});

after(async () => {
  await cleanupRun();
  await disconnect();
});

describe("DELETE /me", () => {
  test("requires the current password", async () => {
    const session = await registerCustomer("del-pw");
    const missing = await call("DELETE", "/me", { token: session.token, body: {} });
    assert.equal(missing.status, 400);
    assert.ok(missing.body.error.fieldErrors.password);
    const wrong = await call("DELETE", "/me", { token: session.token, body: { password: "Wrong-password-1" } });
    assert.equal(wrong.status, 403);
    assert.equal(wrong.body.error.code, "currentPasswordWrong");
    assert.ok(await prisma.user.findUnique({ where: { id: session.customer.id } }), "nothing deleted");
  });

  test("is rate limited per account (5 attempts per 15 minutes)", async () => {
    const session = await registerCustomer("del-rate");
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await call("DELETE", "/me", { token: session.token, body: { password: "Wrong-password-1" } })).status);
    }
    assert.deepEqual(statuses, [403, 403, 403, 403, 403, 429]);
    const right = await call("DELETE", "/me", { token: session.token, body: { password: session.password } });
    assert.equal(right.status, 429);
    assert.ok(await prisma.user.findUnique({ where: { id: session.customer.id } }), "still there");
  });

  test("deletes the account, its cart, wishlist, reset tokens and newsletter subscription; keeps orders", async () => {
    const session = await registerCustomer("del", { phone: "01011113333" });
    const userId = session.customer.id;
    const zone = await activeShippingZone();

    // Build up account data on every table deletion must handle.
    await call("PUT", "/me/cart", { token: session.token, body: { items: [{ productId: fx.products[0]!.id, variantId: null, quantity: 1 }] } });
    await call("PUT", "/me/wishlist", { token: session.token, body: { productIds: [fx.products[1]!.id] } });
    await call("POST", "/auth/forgot-password", { body: { email: session.email } });
    await prisma.newsletterSubscriber.create({ data: { email: session.email } });
    const placed = await call("POST", "/checkout", {
      token: session.token,
      body: checkoutBody([{ productId: fx.products[2]!.id, quantity: 1 }], { governorate: zone.governorate, name: `MTest ${RUN} Deleter` }),
    });
    assert.equal(placed.status, 201);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const web = await webSessionToken(user);

    assert.equal(await prisma.cartItem.count({ where: { userId } }), 1);
    assert.equal(await prisma.wishlistItem.count({ where: { userId } }), 1);
    assert.equal(await prisma.passwordResetToken.count({ where: { userId } }), 1);
    assert.equal(await websiteSessionStatus(web), 200);

    // An unrelated subscriber and another customer's data are untouched.
    const other = await registerCustomer("del-other");
    await call("PUT", "/me/wishlist", { token: other.token, body: { productIds: [fx.products[1]!.id] } });
    await prisma.newsletterSubscriber.create({ data: { email: other.email } });

    const res = await call("DELETE", "/me", { token: session.token, body: { password: session.password } });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.deepEqual(res.body, { deleted: true, ordersRetained: 1 });

    // Deleted.
    assert.equal(await prisma.user.findUnique({ where: { id: userId } }), null);
    assert.equal(await prisma.cartItem.count({ where: { userId } }), 0);
    assert.equal(await prisma.wishlistItem.count({ where: { userId } }), 0);
    assert.equal(await prisma.passwordResetToken.count({ where: { userId } }), 0);
    assert.equal(await prisma.newsletterSubscriber.count({ where: { email: session.email } }), 0);

    // Signed out everywhere, and the credentials no longer work.
    assert.equal((await call("GET", "/me", { token: session.token })).status, 401);
    assert.equal(await websiteSessionStatus(web), 401);
    assert.equal((await call("POST", "/auth/login", { body: { email: session.email, password: session.password } })).status, 401);

    // Retained: the order and its delivery snapshot, no longer linked to an account.
    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: placed.body.orderNumber },
      include: { items: true, customer: true },
    });
    assert.equal(order.userId, null);
    assert.equal(order.items.length, 1);
    assert.equal(order.customer.name, `MTest ${RUN} Deleter`);
    // …and still trackable by order number + phone.
    const lookup = await call("POST", "/orders/lookup", { body: { orderNumber: order.orderNumber, phone: order.customer.phone } });
    assert.equal(lookup.body.found, true);

    // Untouched.
    assert.equal(await prisma.wishlistItem.count({ where: { userId: other.customer.id } }), 1);
    assert.equal(await prisma.newsletterSubscriber.count({ where: { email: other.email } }), 1);
    assert.equal((await call("GET", "/me", { token: other.token })).status, 200);

    // The email address is free to sign up again, as a brand-new account.
    const again = await call("POST", "/auth/register", { body: { name: "Back Again", email: session.email, password: session.password } });
    assert.equal(again.status, 201);
    assert.notEqual(again.body.customer.id, userId);
    assert.deepEqual((await call("GET", "/me/orders", { token: again.body.token })).body.orders, [], "old orders are not re-attached");
  });
});
