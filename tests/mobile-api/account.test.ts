// Mobile API: profile, saved cart and saved wishlist for a signed-in
// customer. See tests/mobile-api/helpers.ts for how to run.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  type CatalogFixture,
  type Session,
  assertServerUsesTestDatabase,
  call,
  cleanupRun,
  createCatalogFixture,
  disconnect,
  isAbsoluteUrl,
  prisma,
  registerCustomer,
  webSessionToken,
} from "./helpers";

let fx: CatalogFixture;
let alice: Session;
let bob: Session;

before(async () => {
  fx = await createCatalogFixture();
  await assertServerUsesTestDatabase(fx);
  alice = await registerCustomer("alice", { phone: "01011112222" });
  bob = await registerCustomer("bob");
});

after(async () => {
  await cleanupRun();
  await disconnect();
});

describe("GET/PATCH /me", () => {
  test("returns the profile without caching", async () => {
    const res = await call("GET", "/me", { token: alice.token });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.deepEqual(res.body.customer, alice.customer);
  });

  test("updates name and phone", async () => {
    const res = await call("PATCH", "/me", { token: alice.token, body: { name: "  Alice Updated  ", phone: "01233334444" } });
    assert.equal(res.status, 200);
    assert.equal(res.body.customer.name, "Alice Updated");
    assert.equal(res.body.customer.phone, "01233334444");
    const row = await prisma.user.findUniqueOrThrow({ where: { id: alice.customer.id } });
    assert.equal(row.name, "Alice Updated");
    assert.equal(row.phone, "01233334444");
    assert.equal((await call("GET", "/me", { token: alice.token })).body.customer.phone, "01233334444");

    const cleared = await call("PATCH", "/me", { token: alice.token, body: { name: "Alice Updated", phone: "" } });
    assert.equal(cleared.body.customer.phone, null);
  });

  test("validates the profile and leaves email untouched", async () => {
    const res = await call("PATCH", "/me", { token: alice.token, body: { name: "A", phone: "123" } });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.fieldErrors.name, "nameTooShort");
    assert.equal(res.body.error.fieldErrors.phone, "invalidPhone");

    const sneaky = await call("PATCH", "/me", {
      token: alice.token,
      body: { name: "Alice Updated", email: "attacker@example.test", sessionVersion: 99 },
    });
    assert.equal(sneaky.status, 200);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: alice.customer.id } });
    assert.equal(row.email, alice.email);
    assert.equal(row.sessionVersion, 0);
  });
});

describe("GET/PUT /me/cart", () => {
  test("saves the cart, dropping lines for unknown products or variants", async () => {
    const [p1, p2] = fx.products;
    const res = await call("PUT", "/me/cart", {
      token: alice.token,
      body: {
        items: [
          { productId: p1!.id, variantId: null, quantity: 2 },
          { productId: fx.variantProduct.id, variantId: fx.variantProduct.variantId, quantity: 1 },
          { productId: p1!.id, variantId: null, quantity: 5 }, // duplicate line: first one wins
          { productId: "no-such-product", variantId: null, quantity: 1 },
          { productId: p2!.id, variantId: "no-such-variant", quantity: 1 },
        ],
      },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.body.cart.length, 2);
    const plain = res.body.cart.find((i: { productId: string }) => i.productId === p1!.id);
    assert.equal(plain.quantity, 2);
    assert.equal(plain.unitPrice, p1!.price);
    assert.ok(isAbsoluteUrl(plain.image));
    const variant = res.body.cart.find((i: { productId: string }) => i.productId === fx.variantProduct.id);
    assert.equal(variant.unitPrice, fx.variantProduct.basePrice + fx.variantProduct.priceDelta, "price comes from the server");
    assert.equal(variant.variantLabel, "Red / M");
    assert.equal(variant.maxStock, 3);

    const read = await call("GET", "/me/cart", { token: alice.token });
    assert.deepEqual(read.body, res.body);
  });

  test("caps quantities at the available stock when read back", async () => {
    await call("PUT", "/me/cart", {
      token: alice.token,
      body: { items: [{ productId: fx.variantProduct.id, variantId: fx.variantProduct.variantId, quantity: 9 }] },
    });
    const read = await call("GET", "/me/cart", { token: alice.token });
    assert.equal(read.body.cart[0].quantity, 3);
  });

  test("is shared with the website's saved cart", async () => {
    await call("PUT", "/me/cart", { token: alice.token, body: { items: [{ productId: fx.products[2]!.id, variantId: null, quantity: 1 }] } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: alice.customer.id } });
    const res = await fetch(`${process.env.MOBILE_API_BASE_URL ?? "http://localhost:3000"}/api/account/state`, {
      headers: { cookie: `dodana_session=${await webSessionToken(user)}` },
    });
    const state = await res.json();
    assert.deepEqual(state.cart.map((i: { productId: string }) => i.productId), [fx.products[2]!.id]);
  });

  test("an empty list clears the cart", async () => {
    const res = await call("PUT", "/me/cart", { token: alice.token, body: { items: [] } });
    assert.deepEqual(res.body.cart, []);
  });

  test("rejects invalid carts", async () => {
    for (const body of [{}, { items: "x" }, { items: [{ productId: fx.products[0]!.id, variantId: null, quantity: 0 }] }, { items: [{ productId: fx.products[0]!.id, quantity: 1 }] }]) {
      const res = await call("PUT", "/me/cart", { token: alice.token, body });
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.equal(res.body.error.code, "invalidRequest");
    }
  });

  test("each customer only sees their own cart", async () => {
    await call("PUT", "/me/cart", { token: alice.token, body: { items: [{ productId: fx.products[0]!.id, variantId: null, quantity: 1 }] } });
    await call("PUT", "/me/cart", { token: bob.token, body: { items: [{ productId: fx.products[1]!.id, variantId: null, quantity: 4 }] } });
    const a = await call("GET", "/me/cart", { token: alice.token });
    const b = await call("GET", "/me/cart", { token: bob.token });
    assert.deepEqual(a.body.cart.map((i: { productId: string }) => i.productId), [fx.products[0]!.id]);
    assert.deepEqual(b.body.cart.map((i: { productId: string }) => i.productId), [fx.products[1]!.id]);
  });
});

describe("GET/PUT /me/wishlist", () => {
  test("saves the wishlist, dropping unknown products and hiding inactive ones", async () => {
    const res = await call("PUT", "/me/wishlist", {
      token: alice.token,
      body: { productIds: [fx.products[0]!.id, fx.products[1]!.id, fx.products[0]!.id, "no-such-product", fx.inactive.id] },
    });
    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.wishlist.map((i: { productId: string }) => i.productId),
      [fx.products[0]!.id, fx.products[1]!.id]
    );
    assert.equal(res.body.wishlist[1].price, fx.products[1]!.price);
    assert.ok(isAbsoluteUrl(res.body.wishlist[0].image));
    assert.deepEqual((await call("GET", "/me/wishlist", { token: alice.token })).body, res.body);
  });

  test("each customer only sees their own wishlist", async () => {
    await call("PUT", "/me/wishlist", { token: bob.token, body: { productIds: [fx.products[3]!.id] } });
    const a = await call("GET", "/me/wishlist", { token: alice.token });
    const b = await call("GET", "/me/wishlist", { token: bob.token });
    assert.ok(!a.body.wishlist.some((i: { productId: string }) => i.productId === fx.products[3]!.id));
    assert.deepEqual(b.body.wishlist.map((i: { productId: string }) => i.productId), [fx.products[3]!.id]);
  });

  test("rejects invalid wishlists", async () => {
    for (const body of [{}, { productIds: "x" }, { productIds: Array(201).fill(fx.products[0]!.id) }]) {
      assert.equal((await call("PUT", "/me/wishlist", { token: alice.token, body })).status, 400, JSON.stringify(body).slice(0, 40));
    }
  });
});
