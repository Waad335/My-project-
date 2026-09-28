// Mobile API: Cash on Delivery checkout (guest and signed in) and a
// customer's own orders. See tests/mobile-api/helpers.ts for how to run.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  type CatalogFixture,
  type Session,
  activeShippingZone,
  assertServerUsesTestDatabase,
  call,
  checkoutBody,
  cleanupRun,
  createCatalogFixture,
  disconnect,
  isAbsoluteUrl,
  prisma,
  registerCustomer,
} from "./helpers";

let fx: CatalogFixture;
let alice: Session;
let bob: Session;
let governorate: string;
let fee: number;

before(async () => {
  fx = await createCatalogFixture();
  await assertServerUsesTestDatabase(fx);
  alice = await registerCustomer("alice");
  bob = await registerCustomer("bob");
  const zone = await activeShippingZone();
  governorate = zone.governorate;
  const settings = await prisma.siteSettings.findUniqueOrThrow({ where: { id: "settings" } });
  assert.equal(settings.freeShippingThreshold, null, "these tests expect no free-shipping threshold in the local settings");
  assert.equal(settings.codEnabled, true, "these tests expect Cash on Delivery to be enabled locally");
  fee = Number(zone.fee);
});

after(async () => {
  await cleanupRun();
  await disconnect();
});

describe("POST /checkout", () => {
  test("a guest can place a Cash on Delivery order; prices come from the server", async () => {
    const [p1] = fx.products;
    const stockBefore = (await prisma.product.findUniqueOrThrow({ where: { id: p1!.id } })).stock;
    const res = await call("POST", "/checkout", {
      body: checkoutBody([{ productId: p1!.id, quantity: 2 }], { governorate, price: 1, total: 1, unitPrice: 1 }),
    });
    assert.equal(res.status, 201);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.match(res.body.orderNumber, /^DOD-\d{4}-\d{4}$/);
    assert.equal(res.body.paymentMethod, "COD");
    assert.equal(res.body.status, "PENDING");
    assert.equal(res.body.linkedToAccount, false);
    assert.equal(res.body.total, p1!.price * 2 + fee);

    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: res.body.orderNumber } });
    assert.equal(order.userId, null);
    assert.equal(order.paymentProvider, "COD");
    assert.equal(order.paymentStatus, "UNPAID");
    assert.equal(Number(order.total), p1!.price * 2 + fee);
    assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: p1!.id } })).stock, stockBefore - 2);
    assert.equal(await prisma.payment.count({ where: { orderId: order.id } }), 0, "no payment provider involved");
  });

  test("a signed-in customer's order is linked to the account, with promo and variant pricing", async () => {
    const res = await call("POST", "/checkout", {
      token: alice.token,
      body: checkoutBody(
        [
          { productId: fx.products[1]!.id, quantity: 1 },
          { productId: fx.variantProduct.id, variantId: fx.variantProduct.variantId, quantity: 1 },
        ],
        { governorate, promoCode: fx.promo.code.toLowerCase(), notes: "Ring the bell" }
      ),
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.linkedToAccount, true);
    const subtotal = fx.products[1]!.price + fx.variantProduct.basePrice + fx.variantProduct.priceDelta;
    const discount = Math.round(subtotal * fx.promo.percent) / 100;
    assert.equal(res.body.total, subtotal - discount + fee);

    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: res.body.orderNumber }, include: { promoCode: true } });
    assert.equal(order.userId, alice.customer.id);
    assert.equal(order.promoCode?.code, fx.promo.code);
  });

  test("online payment (Paymob) is refused; nothing is created", async () => {
    const before = await prisma.order.count();
    const res = await call("POST", "/checkout", {
      token: alice.token,
      body: checkoutBody([{ productId: fx.products[0]!.id, quantity: 1 }], { governorate, paymentMethod: "PAYMOB" }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "paymentMethodUnavailable");
    assert.equal(await prisma.order.count(), before);
  });

  test("an invalid or expired token is rejected instead of silently checking out as a guest", async () => {
    const res = await call("POST", "/checkout", {
      token: "not.a.token",
      body: checkoutBody([{ productId: fx.products[0]!.id, quantity: 1 }], { governorate }),
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, "unauthorized");
  });

  test("out-of-stock, inactive and unknown products are refused with 409", async () => {
    for (const productId of [fx.outOfStock.id, fx.inactive.id, "no-such-product"]) {
      const res = await call("POST", "/checkout", { body: checkoutBody([{ productId, quantity: 1 }], { governorate }) });
      assert.equal(res.status, 409, productId);
      assert.equal(res.body.error.code, "orderUnavailable");
    }
    const tooMany = await call("POST", "/checkout", {
      body: checkoutBody([{ productId: fx.variantProduct.id, variantId: fx.variantProduct.variantId, quantity: 50 }], { governorate }),
    });
    assert.equal(tooMany.status, 409, "more than the variant's stock");
  });

  test("validates the delivery details with per-field errors", async () => {
    const res = await call("POST", "/checkout", {
      body: checkoutBody([], { governorate, phone: "123", address: "x" }),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "invalidRequest");
    for (const key of ["phone", "address", "items"]) assert.ok(res.body.error.fieldErrors[key], key);
  });

  test("refuses Cash on Delivery while it is switched off in the admin settings", async () => {
    await prisma.siteSettings.update({ where: { id: "settings" }, data: { codEnabled: false } });
    try {
      const res = await call("POST", "/checkout", {
        body: checkoutBody([{ productId: fx.products[0]!.id, quantity: 1 }], { governorate }),
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, "codUnavailable");
      assert.deepEqual((await call("GET", "/settings")).body.paymentMethods, []);
    } finally {
      await prisma.siteSettings.update({ where: { id: "settings" }, data: { codEnabled: true } });
    }
  });
});

describe("GET /me/orders", () => {
  let orderNumber: string;

  before(async () => {
    const res = await call("POST", "/checkout", {
      token: bob.token,
      body: checkoutBody([{ productId: fx.products[3]!.id, quantity: 1 }], { governorate, notes: "Bob's note" }),
    });
    assert.equal(res.status, 201);
    orderNumber = res.body.orderNumber;
  });

  test("lists only the customer's own orders, newest first", async () => {
    const res = await call("GET", "/me/orders", { token: bob.token });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.deepEqual(res.body.orders.map((o: { orderNumber: string }) => o.orderNumber), [orderNumber]);
    const [order] = res.body.orders;
    assert.equal(order.itemCount, 1);
    assert.equal(order.items[0].productSlug, fx.products[3]!.slug);
    assert.equal(order.paymentMethod, "COD");

    const aliceOrders = await call("GET", "/me/orders", { token: alice.token });
    assert.ok(!aliceOrders.body.orders.some((o: { orderNumber: string }) => o.orderNumber === orderNumber));
  });

  test("shows an order's details to its owner (case-insensitive number)", async () => {
    const res = await call("GET", `/me/orders/${orderNumber.toLowerCase()}`, { token: bob.token });
    assert.equal(res.status, 200);
    const { order } = res.body;
    assert.equal(order.orderNumber, orderNumber);
    assert.equal(order.shippingFee, fee);
    assert.equal(order.delivery.governorate, governorate);
    assert.equal(order.customerNotes, "Bob's note");
    assert.ok(order.items[0].image === null || isAbsoluteUrl(order.items[0].image));
    assert.ok(!("internalNotes" in order), "staff-only notes are never exposed");
    assert.ok(!JSON.stringify(order).includes("providerReference"));
  });

  test("another customer's order is 404", async () => {
    const res = await call("GET", `/me/orders/${orderNumber}`, { token: alice.token });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "notFound");
  });

  test("guest order lookup still needs the delivery phone", async () => {
    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber }, include: { customer: true } });
    const wrong = await call("POST", "/orders/lookup", { body: { orderNumber, phone: "01099999999" } });
    assert.deepEqual(wrong.body, { found: false });
    const right = await call("POST", "/orders/lookup", { body: { orderNumber, phone: order.customer.phone } });
    assert.equal(right.body.found, true);
    assert.equal(right.body.order.orderNumber, orderNumber);
    assert.ok(!("customer" in right.body.order), "lookup shows no delivery details");
  });
});
