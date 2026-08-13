# VELOURA — Digital Luxury, Reimagined.

A production-ready, headless Shopify storefront for **VELOURA**, a premium digital-products
brand (resume templates, brand kits, digital planners, social media templates, and business
essentials). Built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and a
lazy-loaded Three.js / React Three Fiber 3D experience.

This app lives in this repository alongside the pre-existing **ATHAR** static site (unrelated
brand/project at the repo root) — the two are fully independent and were not merged.

---

## 1. Architecture

```
Custom Frontend (this app)  →  Shopify Storefront API  →  Shopify
     Next.js / React            GraphQL, read + cart          Products, inventory,
     3D, animation, UX                                        checkout, orders, payments
```

Shopify owns commerce: products, variants, prices, inventory, collections, cart, checkout,
orders, customers, payments. This app owns everything else: design, layout, animation, the 3D
experience, and navigation. The Shopify integration is isolated in `lib/shopify/` so the store
can be connected — or swapped — without touching UI code.

### Demo mode

**No Shopify credentials are required to run or preview this app.** When
`SHOPIFY_STOREFRONT_ACCESS_TOKEN` / `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` are unset,
`lib/shopify/index.ts` transparently serves a local, fully-typed demo catalogue
(`lib/shopify/mock-data.ts`) — 12 products across 5 collections — including a working demo cart
(`lib/shopify/cart.ts`, in-memory). This is how the app was built and verified in this session.
The moment real credentials are added, every page switches to live Shopify data automatically —
no code changes required.

---

## 2. What was built

- **Homepage** — cinematic full-bleed hero with a lazy-loaded 3D scene (floating premium
  card/paper objects, scroll- and pointer-reactive camera), asymmetric editorial collection
  grid, featured products pulled live from Shopify, an interactive 3D "workspace" scene (desk,
  laptop, resume, business card, gold pen — hover/scroll reactive), an oversized-type editorial
  brand section, a "Why VELOURA" feature grid, and an auto-advancing testimonial carousel.
- **Shop** (`/shop`) — full product grid wired to Shopify with search, collection filter, price
  range, and sort — all URL-driven (shareable, back-button-safe) and server-rendered.
- **Product detail** (`/products/[handle]`) — gallery with thumbnail switching, price/compare-at,
  digital-product spec sheet (format, size, Canva compatibility, editable, license, included
  files — all metafield-driven), FAQ accordion, "Instant Digital Download" badge, add-to-cart,
  and Shopify product recommendations. Includes `Product` JSON-LD structured data.
- **Collections** (`/collections`, `/collections/[handle]`) — dynamic, Shopify-driven.
- **Cart** — a real Shopify cart drawer (create/add/update/remove via Shopify Storefront API
  cart mutations, or the demo cart when unconfigured), persisted via an httpOnly cookie, with a
  genuine Shopify Checkout URL as the final step (no reimplemented payments).
- **About**, **Contact** (working client-side form — see "Manual setup" below), **FAQ**,
  **Privacy Policy**, **Terms**, **Account** (placeholder for Shopify Customer Accounts).
- **SEO** — per-page metadata, Open Graph + Twitter cards, canonical URLs, `sitemap.xml` and
  `robots.txt` generated from live Shopify data, `Product` JSON-LD.
- **Accessibility** — skip-to-content link, visible focus rings, semantic landmarks, `aria-*`
  on interactive controls (accordion, cart, filters, carousel), `prefers-reduced-motion` support
  throughout (global CSS override + per-component checks), keyboard-operable menu/drawer with
  `Escape`-to-close.
- **Performance** — the Three.js/R3F bundle is dynamically imported (`next/dynamic`, `ssr:
  false`) and only mounts once its section scrolls near the viewport; it never mounts at all on
  mobile viewports or when reduced motion is requested — CSS-only fallback art renders instead.
  Product/collection imagery uses `next/image` with responsive `sizes`.

---

## 3. Project structure

```
veloura/
  app/                        Routes (App Router)
    page.tsx                  Homepage
    shop/                     /shop — filterable product grid
    products/[handle]/        Product detail pages
    collections/               /collections + /collections/[handle]
    about/ contact/ faq/ privacy-policy/ terms/ account/
    sitemap.ts robots.ts       Generated from live Shopify data
    layout.tsx globals.css     Root layout, design tokens
  components/
    layout/                   Navbar, MobileMenu, Footer, CartDrawer
    3d/                       Scene3D (lazy/aware wrapper), Hero + Workspace R3F scenes
    ui/                       Button, Reveal (motion), Accordion, PriceTag, PlaceholderArt…
    shop/                     ProductCard, ProductGrid, ShopFilters, ProductGallery…
    home/                     Hero, FeaturedCollections, FeaturedProducts, Testimonials…
  lib/
    shopify/
      client.ts               Storefront API fetch wrapper (server-only, token never leaves server)
      queries.ts mutations.ts fragments.ts   GraphQL
      index.ts                getProducts, getProduct, getCollections, getCollectionProducts…
      cart.ts                 createCart, getCart, addToCart, updateCart, removeFromCart
      actions.ts              Server Actions the client cart calls directly (cookie-managed)
      mock-data.ts            Demo catalogue used when Shopify isn't configured
      digital-meta.ts         Reads `veloura` metafields into typed digital-product info
    store.ts                  Zustand: cart state + UI (drawer/menu) state
    constants.ts utils.ts
  types/shopify.ts             Shared Storefront API types
```

---

## 4. Connecting Shopify

1. **Create a Shopify store** (or use an existing one).
2. In the Shopify Admin, go to **Settings → Apps and sales channels → Develop apps** (enable
   custom app development if prompted) → **Create an app**.
3. Under **Configuration → Storefront API**, grant at least these scopes:
   `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`,
   `unauthenticated_read_collection_listings`, `unauthenticated_write_checkouts`,
   `unauthenticated_read_checkouts`.
4. Install the app, then copy the **Storefront API access token** from the API credentials tab.
5. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_SITE_URL=https://veloura.com
   ```

   `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is read only in server-only modules (`lib/shopify/client.ts`
   imports `"server-only"`) and is never sent to the browser.

6. Create products and collections in Shopify as usual. Collection **handles** referenced by
   this app for the homepage/editorial layout are: `resume-templates`, `brand-kits`,
   `digital-planners`, `social-media`, `business-essentials` — create collections with those
   handles (or edit `lib/shopify/mock-data.ts`'s collection list / the homepage query to match
   your own). Any additional collections work automatically on `/shop` and `/collections`.

### Digital-product metafields (optional but recommended)

Product pages read a `veloura` metafield namespace to populate the spec sheet and "what's
included" list. In **Settings → Custom data → Products**, add definitions in the `veloura`
namespace:

| Key | Type | Example |
|---|---|---|
| `file_formats` | Single line text | `Canva, PDF, DOCX` |
| `page_count` | Single line text | `2 pages + cover` |
| `canva_compatible` | Boolean | `true` |
| `editable` | Boolean | `true` |
| `included_files` | Single line text | `Resume.pdf, Resume-Editable.canva` |
| `license` | Single line text | `Single-user commercial license` |
| `instant_download` | Boolean | `true` |

Any of these can be left unset — the UI hides fields that aren't present.

Once real credentials are set, **you manage everything from Shopify**: new products, price
changes, and new collections appear on the site automatically (products revalidate every 60s,
collections every 5 minutes) with zero code changes.

---

## 5. Running locally

```bash
cd veloura
npm install
cp .env.example .env.local   # optional — the app runs in demo mode without this
npm run dev
```

Visit `http://localhost:3000`.

```bash
npm run build   # production build
npm start       # serve the production build
npm run lint    # ESLint (flat config, Next 16 + React Compiler rules)
```

This app was built and verified against **Next.js 16** (Turbopack by default) and **React 19**
— note that some APIs differ from earlier Next.js versions (e.g. `params`/`searchParams` are
`Promise`s in Server Components).

---

## 6. Deployment

Recommended: **Vercel** (built by the Next.js team; zero-config for this app).

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **New Project** → import the repo → set the **Root Directory** to `veloura`
   (this app lives in a subdirectory alongside the unrelated ATHAR site).
3. Add the environment variables from `.env.example` in **Project Settings → Environment
   Variables** (`NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`,
   `NEXT_PUBLIC_SITE_URL`).
4. Deploy. Any other Node.js host that supports Next.js (Netlify, Railway, a self-hosted
   `next start` behind a reverse proxy, etc.) also works — this app has no Vercel-only
   dependencies.

## 7. Connecting the domain (veloura.com)

The custom domain points at **the frontend host**, not at Shopify — Shopify stays a pure
commerce backend accessed only via API.

1. In Vercel: **Project → Settings → Domains → Add** → enter `veloura.com` (and `www.veloura.com`
   if desired).
2. Vercel shows the DNS records to add at your domain registrar — typically an `A` record (or
   `ALIAS`/`ANAME`) for the apex domain and a `CNAME` for `www`.
3. Add those records at your registrar/DNS provider. Propagation is usually minutes, occasionally
   up to 48 hours.
4. Once verified, update `NEXT_PUBLIC_SITE_URL=https://veloura.com` in the project's environment
   variables and redeploy — this drives canonical URLs, Open Graph tags, and `sitemap.xml`.
5. Shopify checkout (`checkoutUrl`, returned by the cart) continues to run on Shopify's own
   checkout domain (or your Shopify Plus custom checkout domain, if configured) — this is
   expected and secure; do not attempt to proxy checkout through the custom domain.

---

## 8. Testing performed this session

- `npm run build` — clean production build, all 31 routes compile (static, SSG via
  `generateStaticParams`, and the one dynamic filtered route, `/shop`).
- `npx eslint .` — zero errors, zero warnings.
- `npx tsc` (via `next build`) — zero type errors.
- Production server smoke-tested: every route above returns `200` (and the deliberately-missing
  route returns `404` via `not-found.tsx`).
- Headless-browser pass (desktop 1440×900 and mobile 390×844 viewports) over home → shop →
  product → add-to-cart → cart drawer → mobile menu, asserting **zero console/page errors**.
  Screenshots reviewed manually for visual/contrast issues (one bug found and fixed during this
  pass — see below).
- Verified `prefers-reduced-motion` path: the 3D canvas and CSS-only fallback both render, and
  global CSS collapses animation/transition durations to ~0.

### Bug found and fixed during testing

The hero's two CTA buttons initially rendered with invisible/illegible text — a Tailwind class
collision between the shared `Button` component's default variant classes and one-off override
classes passed via `className` (both a `bg-*` and a `text-*` utility were present for the same
property, and source order — not JSX order — decided the winner). Fixed by adding two proper
`Button` variants (`light`, `outlineLight`) for use on dark backgrounds instead of overriding
classes ad hoc; verified visually after the fix.

---

## 9. What still needs manual setup

- **Real Shopify store connection** — see Section 4. Until then, the site runs on local demo
  data (clearly documented, not a hidden shortcut).
- **Real photography** — no product/lifestyle photography was supplied. Every image slot
  gracefully falls back to an original, deterministic gradient "editorial placeholder" panel
  (`components/ui/PlaceholderArt.tsx`) rather than a broken image or a stock photo. Swap in real
  photography by uploading product images in Shopify (they'll be used automatically) and
  replacing the collection/about-page placeholders' surrounding markup as desired.
- **Contact form backend** — `components/contact/ContactForm.tsx` is a working client-side form
  with a simulated submit. Wire it to a real endpoint (a Next.js Route Handler + email service
  such as Resend, or a form backend like Formspree) before launch.
- **Shopify Customer Accounts** — `/account` is a placeholder. Full sign-in requires integrating
  Shopify's Customer Account API (OAuth), which is a separate, opt-in setup step in Shopify.
- **Testimonials** — currently editorial copy written for this build; replace with real customer
  quotes.
- **Brand assets** — no logo file was supplied; the wordmark is set in the display serif
  (Cormorant Garamond). Add a real favicon/logo file if you have one.
- **Legal copy** — Privacy Policy and Terms pages contain reasonable starter copy, not
  legal advice; have them reviewed before launch.
- **Analytics** — none is wired up; add Vercel Analytics, GA4, or your preferred tool in
  `app/layout.tsx`.
