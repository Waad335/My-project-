# DODANA — Good taste, already found. 💗

A production-grade e-commerce store for **DODANA** (Skincare · Haircare · Perfumes ·
Accessories · Bags), built with Next.js, TypeScript, Tailwind CSS, and PostgreSQL —
with a real product catalog, cart, checkout, shipping logic, order management, and an
admin dashboard for running the store day-to-day without touching code.

Arabic/English bilingual, RTL/LTR aware, mobile-first, and designed around the DODANA
palette (warm ivory, blush pink, mocha brown, soft gold).

---

## 1. What was built

- **Storefront**: home page (hero, shop-by-category, new drop, new arrivals, best
  sellers, featured, "Why DODANA", Instagram section), category pages with
  subcategory/sort filters, product detail pages (gallery, variants, quantity, add to
  cart / buy now, ingredients & warnings, reviews, related products, structured data
  for SEO), new-arrivals & best-sellers pages, FAQ, About, Contact, Shipping Info and
  Returns Policy pages, and an order-tracking page.
- **Cart**: a persistent (localStorage) cart with a slide-in drawer and a full `/cart`
  page — add/remove, change quantities, promo code with live discount calculation,
  subtotal/shipping/total breakdown.
- **Checkout**: customer info, governorate-based shipping (fee + message pulled live
  from the database), Cash on Delivery and (optional) online payment, full server-side
  re-validation and re-pricing of every order (nothing is trusted from the browser).
- **Orders**: 9-state order lifecycle, order numbers, snapshots of product
  name/price/SKU at time of purchase (so later product edits never rewrite history),
  stock decrement on order, promo-code usage tracking.
- **Payments**: a provider-agnostic payment abstraction with **Cash on Delivery**
  (always on) and a real **Paymob** integration (Egypt's leading local gateway) wired
  up server-side with HMAC-verified webhooks — off by default until you add real
  Paymob credentials (see §5).
- **Admin dashboard** (`/admin`, authenticated): dashboard stats, full product CRUD
  (images via upload-or-URL, variants, flags, pricing, stock), category/subcategory
  manager, order list + detail + status updates, shipping-zone fee editor (all 27
  Egyptian governorates seeded), promo code manager, and a settings page (WhatsApp
  number, social links, COD/online-payment toggles, free-shipping threshold,
  announcement bar, and the full returns policy text — all editable without deploys).
- **SEO**: per-page metadata, Open Graph tags, `sitemap.xml` and `robots.txt` generated
  from the live database, JSON-LD `Product` structured data on product pages.
- **i18n**: full English/Arabic UI (cookie-based, no page reload needed) with RTL
  layout, Arabic (Cairo), and Latin (Fraunces/DM Sans) type pairing.
- **Trust content**: FAQ, delivery info, and a returns policy that defaults to a
  "no returns on opened hygiene products, except damaged/defective/incorrect items"
  policy — fully editable from Admin → Settings. Seed reviews are clearly labeled
  "Demo review — for preview only" so they're never mistaken for real testimonials.

The previous project in this repository (a static "ATHAR" site, an unrelated brand)
has been moved to `legacy-athar-static/` rather than deleted, in case anything in it
is still wanted for reference.

---

## 2. Project structure

```
src/
  app/                        Next.js App Router
    page.tsx                  Homepage
    category/[slug]/          Category listing + filters
    product/[slug]/           Product detail page
    cart/, checkout/          Cart & checkout flow
    checkout/success/[orderNumber]/
    track-order/              Customer order lookup
    faq/, about/, contact/, policies/returns/, policies/shipping/
    admin/
      login/                  Admin sign-in (public)
      (protected)/            Everything under here requires an admin session
        page.tsx               Dashboard
        products/, categories/, orders/, shipping/, promo-codes/, settings/
    api/
      checkout/                Order creation (server-side pricing)
      promo/validate/          Promo code validation
      orders/lookup/           Customer order tracking
      payments/paymob/webhook/ Paymob webhook (HMAC verified)
      auth/[...nextauth]/      NextAuth
      admin/*                  Protected admin REST endpoints (products, categories,
                                orders, shipping-zones, promo-codes, settings, upload)
    sitemap.ts, robots.ts
  components/                 UI components, grouped by domain
    ui/, layout/, home/, product/, cart/, checkout/, order/, admin/, icons/, providers/
  lib/
    prisma.ts                 Prisma client singleton
    orders.ts                 Order creation business logic (pricing, stock, promo)
    shipping.ts                Shipping-fee lookup (DB-driven, admin-editable)
    payments/                 Payment provider abstraction (types.ts, cod.ts, paymob.ts)
    validation.ts              Zod schemas (checkout, product, category, etc.)
    auth.ts                   NextAuth config (credentials + bcrypt)
    admin-guard.ts             Server-side admin session guard for API routes
    settings.ts, serialize.ts, queries.ts, storage.ts, utils.ts
  store/                       Zustand stores (cart, toast)
  i18n/, messages/              next-intl config + en.json / ar.json dictionaries
  middleware.ts                 Protects /admin and /api/admin
prisma/
  schema.prisma                 Full data model
  seed.ts                       Seeds categories, products, shipping zones, admin user
legacy-athar-static/            Archived previous project (not part of the build)
```

Business logic (pricing, shipping, payments, order creation) lives entirely in
`src/lib/`, separate from UI components — the same functions back both the public
checkout API and are reused by the seed script's assumptions, so there is one source
of truth for "how much does this order cost."

---

## 3. Technologies used

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript, React 18 |
| Styling | Tailwind CSS (custom DODANA theme: colors, fonts, shadows) |
| Database | PostgreSQL via Prisma ORM (works with self-hosted Postgres or Supabase) |
| Auth | NextAuth (credentials provider, bcrypt password hashing, JWT sessions) |
| State | Zustand (cart, toasts), persisted to `localStorage` |
| Validation | Zod (shared schemas for client forms and server routes) |
| i18n | next-intl (English/Arabic, RTL-aware, cookie-based locale) |
| Fonts | Fraunces (headings), DM Sans (English body), Cairo (Arabic) |
| Payments | Paymob (Egypt) integration + Cash on Delivery, behind a provider interface |
| Icons | lucide-react |

---

## 4. Database structure

Postgres via Prisma (`prisma/schema.prisma`). Key models:

- **AdminUser** — dashboard logins (email, bcrypt hash, role).
- **Category / Subcategory** — the 5 top-level categories (Skincare, Haircare,
  Perfumes, Accessories, Bags) plus subcategories, all admin-editable.
- **Product** — bilingual name/description/ingredients/warnings, price/oldPrice/
  salePrice, stock, availability, SEO slug, feature flags (featured/best-seller/new),
  rating aggregate.
- **ProductImage**, **ProductVariant** (color/size/price-delta/stock), **Review**
  (marked `isDemo` for seed content).
- **Customer**, **Order**, **OrderItem** (immutable name/price/SKU snapshots),
  **Payment** (provider, status, raw webhook payload).
- **PromoCode** — percent/fixed, min order, max discount, usage limits, date window.
- **ShippingZone** — one row per governorate: fee, message, "is Cairo" flag.
- **SiteSettings** — singleton row: WhatsApp number, social links, COD/online-payment
  toggles, free-shipping threshold, announcement bar text, returns policy text.

Run `npm run db:studio` any time to browse/edit the live data in Prisma Studio.

---

## 5. Payment integration status

**Cash on Delivery works out of the box** — no account or setup needed.

**Online payment (Paymob) is implemented but disabled by default** until you connect
a real account. Paymob is the recommended gateway for Egypt: it accepts Visa/
Mastercard, Meeza, and mobile wallets (Vodafone Cash, etc.), and settles to an
Egyptian bank account.

What's built:
- `src/lib/payments/paymob.ts` — the full Auth → Order → Payment Key → iframe redirect
  flow, plus HMAC-SHA512 verification of Paymob's webhook exactly per their spec.
- `src/app/api/payments/paymob/webhook/route.ts` — receives Paymob's "transaction
  processed" callback, verifies the signature, and updates the order's payment status.
- Card data never touches this server — Paymob's hosted iframe collects it directly.
- No secret key is ever sent to the browser; everything lives in server-only env vars.

**To go live**, create a Paymob account at paymob.com and get:
1. **API Key** (Settings → Account Info) → `PAYMOB_API_KEY`
2. **HMAC Secret** (Settings → Webhooks) → `PAYMOB_HMAC_SECRET`
3. **Card integration ID** (Developers → Payment Integrations → "Online Card") →
   `PAYMOB_CARD_INTEGRATION_ID`
4. **iFrame ID** (Developers → iFrames) → `PAYMOB_IFRAME_ID`
5. In Paymob's dashboard, set the webhook URL to
   `https://yourdomain.com/api/payments/paymob/webhook`
6. Set these four env vars in production, then flip **Online payment enabled** on in
   Admin → Settings.

The provider is abstracted behind `PaymentProvider` (`src/lib/payments/types.ts`), so
switching to Fawry, Kashier, or another gateway later means adding one new file, not
rewriting checkout.

---

## 6. Shipping integration status

Shipping is **fully modular and database-driven** — no courier API is faked or
hardcoded. All 27 Egyptian governorates are seeded with a fee and a message
("Fast delivery within Cairo" for Cairo/Giza, "Fast delivery across Egypt" elsewhere),
editable any time from **Admin → Shipping** with no deploy required.

`src/lib/shipping.ts` is the single place that computes a shipping quote — when you're
ready to connect a real courier (a Cairo same-day courier, a national courier company,
etc.), that's the one file to extend; checkout and the admin dashboard don't need to
change.

---

## 7. Credentials/accounts you'll need to connect

| What | Why | Required to launch? |
|---|---|---|
| PostgreSQL database (e.g. a free/paid **Supabase** project, or any managed Postgres) | The live database | **Yes** |
| Hosting (e.g. **Vercel**) | Runs the site | **Yes** |
| A `NEXTAUTH_SECRET` value | Signs admin login sessions | **Yes** (generate with `openssl rand -base64 32`) |
| **Paymob** account | Online card/wallet payments | Only if you want online payment (COD works without it) |
| Object storage (S3, Supabase Storage, or Cloudinary) | Persistent product image uploads on serverless hosting | Recommended before launch — see note below |
| A real WhatsApp Business number | Shown on the WhatsApp button & footer | Set it in Admin → Settings any time |
| Instagram/TikTok URLs | Footer/Instagram section links | Set in Admin → Settings any time |

**Important — image uploads**: the admin "upload image" button currently saves files
to `/public/uploads` on the server's filesystem. That works for a normal Node server
or a self-hosted deployment, but **most serverless hosts (e.g. Vercel) have a
read-only/ephemeral filesystem**, so uploaded files would disappear on the next
deploy. Before launching on serverless hosting, swap the implementation in
`src/lib/storage.ts` (`saveUploadedImage`) for an S3/Supabase Storage/Cloudinary
upload — every upload in the app goes through that one function. Until then, you can
always add product images by pasting a URL instead of uploading a file.

---

## 8. Exact commands to run the project locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then edit .env — at minimum set DATABASE_URL to a real Postgres connection string
# and generate NEXTAUTH_SECRET with: openssl rand -base64 32

# 3. Create the database schema
npm run db:migrate

# 4. Seed categories, products, shipping zones, and the first admin user
npm run db:seed
# this prints the admin login it created, e.g. admin@dodana.com / ChangeMe123!
# (or whatever ADMIN_EMAIL / ADMIN_PASSWORD you set in .env)

# 5. Run the dev server
npm run dev
# → http://localhost:3000       storefront
# → http://localhost:3000/admin admin dashboard (log in with the seeded admin)
```

Other useful scripts: `npm run build` (production build), `npm run typecheck`,
`npm run lint`, `npm run db:studio` (visual database browser).

**Change the seeded admin password immediately** after your first login — there's no
in-app "change password" screen yet, so for now update it via `npm run db:seed` with a
new `ADMIN_PASSWORD` in `.env`, or directly in the database.

---

## 9. Exact steps to deploy

1. **Database**: create a Postgres database (Supabase's free tier is a good fit —
   Project Settings → Database → Connection string). Copy the connection string.
2. **Push this repository to GitHub** (already done if you're reading this from the
   repo).
3. **Deploy to Vercel** (or any Node host):
   - Import the GitHub repo in Vercel.
   - Framework preset: Next.js (auto-detected).
   - Add environment variables from `.env.example` in Vercel's dashboard:
     `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production URL),
     `NEXT_PUBLIC_SITE_URL`, `WHATSAPP_NUMBER`, and the `PAYMOB_*` vars once you have
     them.
   - Deploy.
4. **Run migrations against production** once, from your machine (with `DATABASE_URL`
   pointed at production) or a one-off deploy hook:
   ```bash
   npm run db:deploy   # applies committed migrations, no interactive prompts
   npm run db:seed     # first time only — creates categories/products/admin user
   ```
5. **Set up image storage** per §7 before relying on the upload button in production.
6. **Point your domain** at the Vercel deployment, then update `NEXTAUTH_URL` and
   `NEXT_PUBLIC_SITE_URL` to the final domain.
7. Log into `/admin`, change the seeded password's account details, set your real
   WhatsApp number/social links/shipping fees/returns policy in Settings.

---

## 10. Exact steps to add products later (no code required)

1. Go to `/admin` and log in.
2. **Categories** already exist (Skincare, Haircare, Perfumes, Accessories, Bags) —
   add subcategories from **Admin → Categories** if you want finer filtering.
3. Go to **Admin → Products → Add Product**.
4. Fill in English & Arabic name/description (ingredients/warnings optional — use
   them for skincare, haircare, and perfume products where relevant).
5. Pick category/subcategory, set price (and old price / sale price for a discount
   badge), stock quantity, and availability.
6. Toggle **Featured / Best Seller / New Arrival** to control where it shows up on the
   homepage.
7. Add images — either upload files or paste image URLs — and, if the product has
   colors/sizes, add variants (each with its own SKU, stock, and optional price
   difference).
8. Save. It's live on the storefront immediately — no deploy needed.

Editing or deleting a product works the same way from the **Products** list; deleting
a product that already has order history automatically deactivates it instead
(keeping past orders intact) rather than breaking referential integrity.

---

## 11. What was tested this session

Run inside this session against a real local Postgres database:
`npm run typecheck`, `npm run lint`, and `npm run build` all pass clean. The full
purchase path was exercised end-to-end via the actual API (not mocked): placed a real
order with a promo code through `/api/checkout`, confirmed the database recorded the
correct subtotal/discount/shipping/total, confirmed stock and promo usage decremented
correctly, confirmed the order appeared in the admin dashboard, updated its status
from the admin UI, and looked it up again through the public order-tracking page.
Admin authentication (login, session, middleware-protected routes) was verified with
a real credentials login. Every storefront and admin page was screenshotted at both a
mobile (390px) and desktop (1440px) viewport with zero browser console errors.

## 12. Remaining production tasks

- Connect a **real Postgres database** (this session ran against a local one) and a
  **Paymob account** if you want online payment — see §5 and §7.
- Swap local file uploads for **S3/Supabase Storage/Cloudinary** if deploying to
  serverless hosting — see the note in §7.
- Replace the **on-brand placeholder product photography** (`public/placeholders/*`,
  labeled "Sample image") with real product photos as you add them.
- Replace the two demo reviews per product (clearly labeled "Demo review — for
  preview only") with real customer reviews once you have them, or remove them.
- Change the seeded admin password (§8) and consider adding a second admin/staff
  account from the database directly (there's no self-serve "invite user" screen yet).
- Add a real "hello@dodana.com"-style inbox if you want the Contact page's email to be
  monitored (it's currently a static display, not a working mailbox).
- Consider adding rate limiting at the edge/CDN level (e.g. Vercel's built-in
  protections, or a WAF) for public POST routes (`/api/checkout`, `/api/promo/validate`)
  before high-traffic launch — the app itself validates and rate-limits nothing beyond
  standard input validation and Prisma's parameterized queries (which already prevent
  SQL injection).
