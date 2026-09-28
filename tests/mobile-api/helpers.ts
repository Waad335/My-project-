// Shared harness for the mobile API integration tests (tests/mobile-api).
//
// These tests call a running Dodana server over HTTP and create their own
// fixtures (a category, products, a promo code, customer accounts, orders)
// directly in the database, removing them all afterwards. They must only
// ever run against a local development database and a local server, so
// this module refuses to load otherwise.
//
// Run with: npm run build && npm start   (in one terminal, local .env)
//           npm run test:mobile-api       (in another)
// MOBILE_API_BASE_URL overrides the server address (default
// http://localhost:3000).
import { createHash, randomBytes, randomInt } from "node:crypto";
import { SignJWT } from "jose";
import { PrismaClient, type Prisma } from "@prisma/client";
import { CUSTOMER_TOKEN_ISSUER, WEB_SESSION_AUDIENCE, signCustomerToken } from "../../src/lib/customer-token";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function hostOf(url: string, name: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    throw new Error(`${name} is not a valid URL — refusing to run the mobile API tests.`);
  }
}

export const BASE_URL = (process.env.MOBILE_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const databaseUrl = process.env.DATABASE_URL ?? "";

// Safety guard: never touch a remote database or a deployed server.
if (!databaseUrl) throw new Error("DATABASE_URL is not set — run with the local .env (npm run test:mobile-api).");
if (!LOCAL_HOSTS.has(hostOf(databaseUrl, "DATABASE_URL")) || /supabase|pooler|amazonaws/i.test(databaseUrl)) {
  throw new Error("DATABASE_URL is not a local database — the mobile API tests only run against a local/test database.");
}
if (!LOCAL_HOSTS.has(hostOf(BASE_URL, "MOBILE_API_BASE_URL"))) {
  throw new Error("MOBILE_API_BASE_URL is not a local server — the mobile API tests only run against localhost.");
}

export const prisma = new PrismaClient();

// Unique per test process, so fixtures from different runs never collide.
export const RUN = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
export const API = `${BASE_URL}/api/mobile/v1`;

// Each request can come from its own client IP (X-Forwarded-For), so the
// server's per-IP rate limits never leak between tests or runs. Addresses
// are from 198.18.0.0/15, the range reserved for network testing.
let ipCounter = randomInt(0, 1 << 17);
export function nextIp(): string {
  ipCounter = (ipCounter + 1) % (1 << 17);
  return `198.${18 + (ipCounter >> 16)}.${(ipCounter >> 8) & 255}.${ipCounter & 255}`;
}

export type ApiResult<T = any> = { status: number; headers: Headers; body: T };

export async function call<T = any>(
  method: string,
  path: string,
  options: { body?: unknown; rawBody?: string; token?: string; ip?: string; headers?: Record<string, string> } = {}
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { "x-forwarded-for": options.ip ?? nextIp(), ...options.headers };
  if (options.token !== undefined) headers.authorization = `Bearer ${options.token}`;
  let body: string | undefined;
  if (options.rawBody !== undefined) body = options.rawBody;
  else if (options.body !== undefined) body = JSON.stringify(options.body);
  if (body !== undefined) headers["content-type"] = "application/json";

  const url = path.startsWith("http") ? path : `${path.startsWith("/api/") ? BASE_URL : API}${path}`;
  const res = await fetch(url, { method, headers, body, redirect: "manual" });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON responses (e.g. an HTML page) are returned as text.
  }
  return { status: res.status, headers: res.headers, body: parsed as T };
}

// --- tokens ----------------------------------------------------------------

function signingKey(): Uint8Array {
  const secret = process.env.CUSTOMER_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("CUSTOMER_AUTH_SECRET / NEXTAUTH_SECRET must be set (same .env as the server).");
  return new Uint8Array(createHash("sha256").update(`dodana-customer-session:${secret}`).digest());
}

// A website session cookie for a user, as the website itself would issue it.
export async function webSessionToken(user: { id: string; sessionVersion: number }): Promise<string> {
  return signCustomerToken(user, WEB_SESSION_AUDIENCE);
}

// A correctly signed token whose expiry is already in the past.
export async function expiredToken(user: { id: string; sessionVersion: number }, audience: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ sv: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(CUSTOMER_TOKEN_ISSUER)
    .setAudience(audience)
    .setIssuedAt(now - 3600)
    .setExpirationTime(now - 60)
    .sign(signingKey());
}

// GET /api/account/state with a website session cookie: 200 when the
// website accepts the session, 401 when it doesn't.
export async function websiteSessionStatus(cookieValue: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/api/account/state`, {
    headers: { cookie: `dodana_session=${cookieValue}`, "x-forwarded-for": nextIp() },
  });
  await res.arrayBuffer();
  return res.status;
}

// --- fixtures --------------------------------------------------------------

export const TEST_PASSWORD = "Mobile-Test-Pass-1";

export function testEmail(label: string): string {
  return `mtest+${RUN}-${label}@example.test`;
}

export function testPhone(): string {
  return `0155${String(randomInt(0, 10_000_000)).padStart(7, "0")}`;
}

export type Session = {
  token: string;
  customer: { id: string; email: string; name: string; phone: string | null; createdAt: string };
  email: string;
  password: string;
};

// Registers a customer through the API and returns the app session.
export async function registerCustomer(label: string, extra: { name?: string; phone?: string } = {}): Promise<Session> {
  const email = testEmail(label);
  const res = await call("POST", "/auth/register", {
    body: { name: extra.name ?? `MTest ${RUN} ${label}`, email, phone: extra.phone ?? "", password: TEST_PASSWORD },
  });
  if (res.status !== 201) throw new Error(`register ${label} failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: res.body.token, customer: res.body.customer, email, password: TEST_PASSWORD };
}

export type CatalogFixture = {
  category: { id: string; slug: string };
  subcategory: { id: string; slug: string };
  inactiveSubcategory: { id: string; slug: string };
  // Active, in stock, ascending prices 100/200/300/400.
  products: { id: string; slug: string; sku: string; price: number }[];
  variantProduct: { id: string; slug: string; variantId: string; basePrice: number; priceDelta: number };
  inactive: { id: string; slug: string };
  outOfStock: { id: string; slug: string };
  promo: { code: string; percent: number };
  keyword: string;
};

// A private category (inactive, so it never appears in the website's
// category grid or navigation) with its own products and a promo code.
export async function createCatalogFixture(): Promise<CatalogFixture> {
  const keyword = `Mtestword${RUN}`;
  const category = await prisma.category.create({
    data: {
      slug: `mtest-${RUN}`,
      nameEn: `MTest ${RUN} Category`,
      nameAr: `فئة اختبار ${RUN}`,
      image: "/categories/skincare.jpg",
      isActive: false,
    },
  });
  const subcategory = await prisma.subcategory.create({
    data: { slug: `mtest-${RUN}-sub`, nameEn: "MTest Sub", nameAr: "فرعي", categoryId: category.id, sortOrder: 1 },
  });
  const inactiveSubcategory = await prisma.subcategory.create({
    data: {
      slug: `mtest-${RUN}-hidden`,
      nameEn: "MTest Hidden Sub",
      nameAr: "مخفي",
      categoryId: category.id,
      isActive: false,
      sortOrder: 2,
    },
  });

  const base = (i: number, extra: Partial<Prisma.ProductUncheckedCreateInput> = {}): Prisma.ProductUncheckedCreateInput => ({
    sku: `MTEST-${RUN}-${i}`,
    slug: `mtest-${RUN}-p${i}`,
    nameEn: `${keyword} Piece ${i}`,
    nameAr: `قطعة اختبار ${i}`,
    descriptionEn: "Test fixture — local database only.",
    descriptionAr: "بيانات اختبار محلية فقط.",
    categoryId: category.id,
    price: 100 * i,
    stock: 20,
    ...extra,
  });

  const products = [];
  for (let i = 1; i <= 4; i++) {
    const p = await prisma.product.create({
      data: {
        ...base(i, {
          subcategoryId: i <= 2 ? subcategory.id : null,
          ratingAvg: [3.5, 4.8, 4.1, 2.0][i - 1],
          // Oldest first, so "newest" is the reverse of creation order.
          createdAt: new Date(Date.now() - (10 - i) * 60_000),
        }),
        images: {
          create: [
            { url: `/uploads/mtest-${RUN}-${i}.jpg`, sortOrder: 0 },
            { url: `https://images.example.test/mtest-${RUN}-${i}-b.jpg`, sortOrder: 1 },
          ],
        },
      },
    });
    products.push({ id: p.id, slug: p.slug, sku: p.sku, price: 100 * i });
  }

  const vp = await prisma.product.create({
    data: {
      ...base(5, { price: 250, createdAt: new Date(Date.now() - 20 * 60_000) }),
      variants: { create: [{ sku: `MTEST-${RUN}-5-RED`, color: "Red", size: "M", priceDelta: 30, stock: 3 }] },
    },
    include: { variants: true },
  });
  const inactive = await prisma.product.create({ data: base(6, { isActive: false }) });
  const outOfStock = await prisma.product.create({ data: base(7, { price: 700, stock: 0, availability: "OUT_OF_STOCK" }) });

  const promo = await prisma.promoCode.create({ data: { code: `MTEST${RUN}`.toUpperCase(), type: "PERCENT", value: 10 } });

  return {
    category: { id: category.id, slug: category.slug },
    subcategory: { id: subcategory.id, slug: subcategory.slug },
    inactiveSubcategory: { id: inactiveSubcategory.id, slug: inactiveSubcategory.slug },
    products,
    variantProduct: { id: vp.id, slug: vp.slug, variantId: vp.variants[0]!.id, basePrice: 250, priceDelta: 30 },
    inactive: { id: inactive.id, slug: inactive.slug },
    outOfStock: { id: outOfStock.id, slug: outOfStock.slug },
    promo: { code: promo.code, percent: 10 },
    keyword,
  };
}

// The server must be reading the same database the fixtures were written
// to; otherwise every assertion below would be meaningless.
export async function assertServerUsesTestDatabase(fixture: CatalogFixture): Promise<void> {
  const res = await call("GET", `/categories/${fixture.category.slug}`);
  if (res.status !== 200) {
    throw new Error(`The server at ${BASE_URL} can't see the test fixtures (status ${res.status}) — is it running on the same local database?`);
  }
}

export async function activeShippingZone() {
  const zone = await prisma.shippingZone.findFirst({ where: { isActive: true }, orderBy: { governorate: "asc" } });
  if (!zone) throw new Error("The local database has no active shipping zone — run the seed first.");
  return zone;
}

export function checkoutBody(items: { productId: string; variantId?: string | null; quantity: number }[], extra: Record<string, unknown> = {}) {
  return {
    name: `MTest ${RUN} Buyer`,
    phone: testPhone(),
    whatsapp: "",
    email: "",
    governorate: "Cairo",
    city: "Test City",
    address: "1 Test Street, local fixture",
    buildingInfo: "",
    notes: "",
    paymentMethod: "COD",
    promoCode: "",
    items,
    ...extra,
  };
}

// Removes everything this run created. Orders go first (their items point
// at the fixture products), then the guest-checkout customer snapshots,
// accounts (wishlist, cart and reset tokens cascade), products and the
// category.
export async function cleanupRun(): Promise<void> {
  const products = await prisma.product.findMany({ where: { sku: { startsWith: `MTEST-${RUN}` } }, select: { id: true } });
  const productIds = products.map((p) => p.id);
  const users = await prisma.user.findMany({ where: { email: { startsWith: `mtest+${RUN}` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { items: { some: { productId: { in: productIds } } } },
        { userId: { in: userIds } },
        { customer: { name: { startsWith: `MTest ${RUN}` } } },
      ],
    },
    select: { id: true, customerId: true },
  });
  await prisma.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } });
  await prisma.customer.deleteMany({
    where: { OR: [{ id: { in: orders.map((o) => o.customerId) } }, { name: { startsWith: `MTest ${RUN}` } }], orders: { none: {} } },
  });
  await prisma.promoCode.deleteMany({ where: { code: { startsWith: `MTEST${RUN}`.toUpperCase() } } });
  await prisma.newsletterSubscriber.deleteMany({ where: { email: { startsWith: `mtest+${RUN}` } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: `mtest-${RUN}` } } });
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

export function isAbsoluteUrl(value: unknown): boolean {
  return typeof value === "string" && /^https?:\/\//.test(value);
}
