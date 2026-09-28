// Mobile API: public catalog, settings, shipping and the two website
// endpoints the app reuses (promo check, guest order lookup).
// See tests/mobile-api/helpers.ts for how to run.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  type CatalogFixture,
  activeShippingZone,
  assertServerUsesTestDatabase,
  call,
  cleanupRun,
  createCatalogFixture,
  disconnect,
  isAbsoluteUrl,
  prisma,
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

const slugs = (res: { body: { products: { slug: string }[] } }) => res.body.products.map((p) => p.slug);

describe("GET /home", () => {
  test("returns every home section with absolute media URLs and short public caching", async () => {
    const res = await call("GET", "/home");
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "public, max-age=60");
    assert.equal(res.headers.get("x-dodana-api-version"), "1");
    for (const key of ["showcase", "shopCategories", "departments", "featured", "newArrivals", "bestSellers"]) {
      assert.ok(Array.isArray(res.body[key]), key);
    }
    assert.ok(res.body.newArrivals.length <= 12);
    for (const c of res.body.shopCategories) assert.ok(c.image === null || isAbsoluteUrl(c.image), c.slug);
    for (const p of [...res.body.featured, ...res.body.newArrivals, ...res.body.bestSellers]) {
      assert.ok(p.image === null || isAbsoluteUrl(p.image), p.slug);
    }
    for (const s of res.body.showcase) assert.ok(s.slug && isAbsoluteUrl(s.image), s.id);
    // The private test category is inactive, so it stays off the home screen.
    assert.ok(!res.body.shopCategories.some((c: { slug: string }) => c.slug === fx.category.slug));
  });

  test("matches the website's category grid (active categories + the extra departments)", async () => {
    const res = await call("GET", "/home");
    const active = await prisma.category.findMany({ where: { isActive: true }, select: { slug: true } });
    const extras = await prisma.category.findMany({
      where: { slug: { in: ["women", "kids", "home", "beauty"] }, isActive: false },
      select: { slug: true },
    });
    const got = res.body.shopCategories.map((c: { slug: string }) => c.slug).sort();
    assert.deepEqual(got, [...active, ...extras].map((c) => c.slug).sort());
    const home = res.body.shopCategories.find((c: { slug: string }) => c.slug === "home");
    if (home) assert.equal(home.nameEn, "Home & Living");
  });
});

describe("GET /categories and /categories/:slug", () => {
  test("lists shop categories and departments", async () => {
    const res = await call("GET", "/categories");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.shopCategories));
    assert.ok(Array.isArray(res.body.departments));
    for (const d of res.body.departments) assert.ok(Array.isArray(d.subcategories), d.slug);
  });

  test("returns one category with only its active subcategories", async () => {
    const res = await call("GET", `/categories/${fx.category.slug}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.category.slug, fx.category.slug);
    assert.ok(isAbsoluteUrl(res.body.category.image));
    assert.deepEqual(
      res.body.category.subcategories.map((s: { slug: string }) => s.slug),
      [fx.subcategory.slug]
    );
  });

  test("unknown category is 404 notFound", async () => {
    const res = await call("GET", "/categories/no-such-category-xyz");
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "notFound");
  });
});

describe("GET /products", () => {
  test("lists only active products, filtered by category", async () => {
    const res = await call("GET", `/products?category=${fx.category.slug}&pageSize=48`);
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 6, "4 plain + 1 with variants + 1 out of stock; the inactive one is hidden");
    assert.ok(!slugs(res).includes(fx.inactive.slug));
    assert.ok(slugs(res).includes(fx.outOfStock.slug), "out of stock pieces are still listed, like the website");
  });

  test("sorts by price, newest and rating", async () => {
    const cat = `category=${fx.category.slug}&sub=${fx.subcategory.slug}`;
    const [p1, p2] = fx.products;
    assert.deepEqual(slugs(await call("GET", `/products?${cat}&sort=price-asc`)), [p1!.slug, p2!.slug]);
    assert.deepEqual(slugs(await call("GET", `/products?${cat}&sort=price-desc`)), [p2!.slug, p1!.slug]);
    assert.deepEqual(slugs(await call("GET", `/products?${cat}&sort=newest`)), [p2!.slug, p1!.slug]);
    assert.deepEqual(slugs(await call("GET", `/products?${cat}&sort=rating`)), [p2!.slug, p1!.slug]);
    const all = await call("GET", `/products?category=${fx.category.slug}&sort=price-asc&pageSize=48`);
    const prices = all.body.products.map((p: { price: number }) => p.price);
    assert.deepEqual(prices, [...prices].sort((a: number, b: number) => a - b));
  });

  test("filters by subcategory and price range", async () => {
    const sub = await call("GET", `/products?category=${fx.category.slug}&sub=${fx.subcategory.slug}`);
    assert.deepEqual(slugs(sub).sort(), [fx.products[0]!.slug, fx.products[1]!.slug].sort());
    const range = await call("GET", `/products?category=${fx.category.slug}&minPrice=200&maxPrice=300&sort=price-asc`);
    assert.deepEqual(slugs(range), [fx.products[1]!.slug, fx.variantProduct.slug, fx.products[2]!.slug]);
  });

  test("searches names and SKUs", async () => {
    const byName = await call("GET", `/products?q=${fx.keyword.toLowerCase()}&pageSize=48`);
    assert.equal(byName.body.total, 6);
    const bySku = await call("GET", `/products?q=${fx.products[2]!.sku}`);
    assert.deepEqual(slugs(bySku), [fx.products[2]!.slug]);
    const arabic = await call("GET", `/products?q=${encodeURIComponent("قطعة اختبار 3")}&category=${fx.category.slug}`);
    assert.deepEqual(slugs(arabic), [fx.products[2]!.slug]);
  });

  test("paginates without repeating items, and pages past the end are empty", async () => {
    const q = `category=${fx.category.slug}&sort=price-asc&pageSize=4`;
    const page1 = await call("GET", `/products?${q}&page=1`);
    const page2 = await call("GET", `/products?${q}&page=2`);
    const page3 = await call("GET", `/products?${q}&page=3`);
    assert.equal(page1.body.pageCount, 2);
    assert.equal(page1.body.products.length, 4);
    assert.equal(page2.body.products.length, 2);
    assert.equal(new Set([...slugs(page1), ...slugs(page2)]).size, 6);
    assert.deepEqual(page3.body.products, []);
    assert.equal(page3.body.total, 6);
    assert.equal(page3.body.page, 3);
  });

  test("returns absolute image URLs", async () => {
    const res = await call("GET", `/products?q=${fx.products[0]!.sku}`);
    const [p] = res.body.products;
    // Site-relative paths get the site's origin; full URLs are left alone.
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
    assert.equal(p.image, `${siteUrl}/uploads/${fx.category.slug}-1.jpg`);
    assert.equal(p.hoverImage, `https://images.example.test/${fx.category.slug}-1-b.jpg`);
  });

  test("rejects invalid query values with field errors", async () => {
    const sort = await call("GET", "/products?sort=cheapest");
    assert.equal(sort.status, 400);
    assert.ok(sort.body.error.fieldErrors.sort);
    const size = await call("GET", "/products?pageSize=500");
    assert.equal(size.status, 400);
    assert.ok(size.body.error.fieldErrors.pageSize);
    const empty = await call("GET", "/products?q=&page=&sort=");
    assert.equal(empty.status, 200, "empty values are treated as absent");
  });
});

describe("GET /products/:slug", () => {
  test("returns the product with gallery, variants and related pieces", async () => {
    const res = await call("GET", `/products/${fx.variantProduct.slug}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.product.slug, fx.variantProduct.slug);
    assert.equal(res.body.product.variants.length, 1);
    assert.ok(Array.isArray(res.body.related));
    assert.ok(res.body.related.length <= 4);
    assert.ok(!res.body.related.some((p: { slug: string }) => p.slug === fx.variantProduct.slug));

    const withImages = await call("GET", `/products/${fx.products[0]!.slug}`);
    assert.equal(withImages.body.product.images.length, 2);
    for (const img of withImages.body.product.images) assert.ok(isAbsoluteUrl(img.url));
  });

  test("inactive and unknown products are 404", async () => {
    assert.equal((await call("GET", `/products/${fx.inactive.slug}`)).status, 404);
    const res = await call("GET", "/products/no-such-product-xyz");
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "notFound");
  });
});

describe("GET /search/suggest", () => {
  test("needs at least 2 characters and returns at most 5 active products", async () => {
    assert.deepEqual((await call("GET", "/search/suggest?q=a")).body.products, []);
    const res = await call("GET", `/search/suggest?q=${fx.keyword}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.products.length, 5);
    assert.ok(!slugs(res).includes(fx.inactive.slug));
  });
});

describe("GET /settings", () => {
  test("offers Cash on Delivery only, and only while it is enabled", async () => {
    const settings = await prisma.siteSettings.findUniqueOrThrow({ where: { id: "settings" } });
    const res = await call("GET", "/settings");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.paymentMethods, settings.codEnabled ? ["COD"] : []);
    assert.ok(!JSON.stringify(res.body).toLowerCase().includes("paymob"));
    assert.ok(isAbsoluteUrl(res.body.siteUrl));
    for (const key of ["whatsappNumber", "instagramUrl", "tiktokUrl", "returnsPolicyEn", "returnsPolicyAr"]) {
      assert.ok(key in res.body, key);
    }
  });
});

describe("shipping", () => {
  test("GET /shipping/zones lists active zones with fees", async () => {
    const res = await call("GET", "/shipping/zones");
    assert.equal(res.status, 200);
    const count = await prisma.shippingZone.count({ where: { isActive: true } });
    assert.equal(res.body.zones.length, count);
    for (const z of res.body.zones) {
      assert.equal(typeof z.fee, "number");
      assert.ok(z.governorate && z.governorateAr);
    }
  });

  test("POST /shipping/quote returns the fee checkout will charge", async () => {
    const zone = await activeShippingZone();
    const res = await call("POST", "/shipping/quote", { body: { governorate: zone.governorate, subtotal: 100 } });
    assert.equal(res.status, 200);
    assert.equal(res.body.governorate, zone.governorate);
    assert.equal(res.body.isCairo, zone.isCairo);
    const settings = await prisma.siteSettings.findUniqueOrThrow({ where: { id: "settings" } });
    const free = settings.freeShippingThreshold !== null && 100 >= Number(settings.freeShippingThreshold);
    assert.equal(res.body.fee, free ? 0 : Number(zone.fee));
    assert.equal((await call("POST", "/shipping/quote", { body: { governorate: "x" } })).status, 400);
  });
});

describe("website endpoints mounted under /api/mobile/v1", () => {
  test("POST /promo/validate checks a code", async () => {
    const ok = await call("POST", "/promo/validate", { body: { code: fx.promo.code.toLowerCase(), subtotal: 200 } });
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.body, { valid: true, code: fx.promo.code, discountAmount: 20 });
    const bad = await call("POST", "/promo/validate", { body: { code: "NO-SUCH-CODE", subtotal: 200 } });
    assert.equal(bad.body.valid, false);
  });

  test("POST /orders/lookup never reveals an order without the matching phone", async () => {
    const res = await call("POST", "/orders/lookup", { body: { orderNumber: "DOD-0000-0000", phone: "01012345678" } });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { found: false });
  });
});
