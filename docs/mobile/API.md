# Dodana mobile API — v1

The mobile app (Android and iPhone) talks only to this API. It never connects to the database, Supabase or any other backend directly, and it holds no server secrets. The API runs inside the existing Next.js app under `/api/mobile/v1`. It reuses the website's own queries, account logic and order logic, so the app and the website always agree on prices, stock, shipping and accounts.

- **Base URL:** `<site origin>/api/mobile/v1`. During development this is the local dev server, never production.
- **Format:** JSON request and response bodies. Request bodies are limited to 64 KB (larger ones get `413`).
- **Version header:** every response sets `X-Dodana-Api-Version: 1`. The two endpoints reused from the website (promo check and guest order lookup) are the exception; they return the website's responses unchanged.
- **Caching:** catalog responses send `Cache-Control: public, max-age=60`. Everything tied to a customer, and every error, sends `Cache-Control: no-store`.
- **Language:** the default is English. Arabic is used for `?locale=ar`, or when `Accept-Language` starts with `ar`. Content fields always come in both languages (`nameEn`/`nameAr`, …). Only error messages and the forgot-password confirmation are localized.
- **Media:** every image and model URL is absolute. Site-relative paths such as `/categories/…` and `/uploads/…` are prefixed with the site origin.
- **Types:** the response contract is in `src/lib/mobile/types.ts`. It contains pure types only, so the app can copy it.

## Authentication

Customers use the same accounts as the website (the `users` table), with the same passwords, rules and rate limits.

| | Website | App |
|---|---|---|
| Carrier | httpOnly cookie `dodana_session` | `Authorization: Bearer <token>` |
| Token | HS256 JWT, issuer `dodana-storefront` | same |
| Audience | `dodana-customer` | `dodana-customer-mobile` |
| Lifetime | 30 days | 30 days (`expiresAt` in the response) |
| Claims | `sub` = user id, `sv` = `User.sessionVersion` | same |

- **The two tokens are not interchangeable.** Because the audiences differ, a website cookie is rejected by the app API and an app token is rejected by the website.
- **Revocation.** A token is only valid while its `sv` matches `User.sessionVersion`. Changing or resetting the password bumps it, which signs out every website session and every app token at once. Deleting the account also invalidates every token.
- **Storage.** The app should keep the token in the platform's secure storage (Keychain or Keystore via `expo-secure-store`), never in plain storage.
- **Sign-out** happens on the device: the app discards the token. There is no server call.
- **Admin access is unaffected.** The ADMIN/STAFF dashboard keeps its own NextAuth sessions and role checks. A customer token gives no access to `/api/admin/*`, and the tests verify this.
- **Password reset** has no in-app flow in v1. `POST /auth/forgot-password` emails the same link the website sends, and that link opens the website's `/account/reset-password` page.

A customer endpoint called without a valid token returns `401 unauthorized`. `POST /checkout` also works without a token, as guest checkout. If a token is sent but is invalid or expired, checkout still returns `401`, so the app can ask the customer to sign in again instead of silently placing a guest order.

## Errors

Every error has the same shape:

```json
{ "error": { "code": "invalidRequest", "message": "Something in the request isn't valid.", "fieldErrors": { "phone": "invalidPhone" } } }
```

- `code` is stable. The app can switch on it.
- `message` is ready to show, localized per request.
- `fieldErrors` is optional and maps a field to an error code. For account forms these codes are the website's translation keys (`invalidEmail`, `passwordTooShort`, `nameTooShort`, `invalidPhone`, `passwordsDontMatch`, `emailInUse`, `currentPasswordWrong`, …). For checkout they are the website's checkout validation messages.

| Status | `code` | When |
|---|---|---|
| 400 | `invalidRequest` | Missing, malformed or invalid input. `fieldErrors` says which field. |
| 400 | `paymentMethodUnavailable` | Checkout with anything other than `COD`. |
| 400 | `codUnavailable` | Cash on Delivery is switched off in the admin settings. |
| 401 | `unauthorized` | Missing, invalid or expired token, or a token revoked by a password change or account deletion. |
| 401 | `invalidCredentials` | Wrong email or password. The same answer is given for unknown emails. |
| 403 | `currentPasswordWrong` | Wrong current password when changing the password or deleting the account. |
| 404 | `notFound` | Unknown or inactive product, unknown category, or an order that isn't the customer's. |
| 409 | `emailInUse` | Registration with an email that already has an account. |
| 409 | `orderUnavailable` | A product in the order is out of stock, inactive or gone. `message` names it. |
| 413 | `payloadTooLarge` | Request body over 64 KB. |
| 429 | `tooManyAttempts` | Rate limit reached (see below). |
| 500 | `serverError` | Unexpected failure. Details are logged on the server, never returned. |

Rate limits are the website's, and they share the same buckets:

| Action | Limit |
|---|---|
| Register | 10 per hour per IP |
| Sign in | 20 per 15 minutes per IP, and 8 per 15 minutes per IP + email |
| Forgot password | 5 per hour per IP |
| Change password | 8 per 15 minutes per account |
| Delete account | 5 per 15 minutes per account |

## Endpoints

### Catalog (public)

| Method | Path | Response |
|---|---|---|
| GET | `/home` | `HomeResponse`: `showcase`, `shopCategories` (the website's "Shop by category" cards), `departments` (the nav categories with subcategories), `featured`, `newArrivals` (≤ 12), `bestSellers`. Uses the same fallbacks as the website homepage. |
| GET | `/categories` | `{ shopCategories, departments }` |
| GET | `/categories/:slug` | `{ category }` with its active subcategories. `404` if unknown. |
| GET | `/products` | `ProductListResponse`: `{ products, total, page, pageSize, pageCount }` |
| GET | `/products/:slug` | `{ product, related }`: gallery, variants, approved reviews, and up to 4 related pieces. `404` for unknown or inactive products. |
| GET | `/search/suggest?q=` | `{ products }`: up to 5 products, and only for 2 or more characters (same as the website's search box). |

`GET /products` takes these query parameters. All are optional, and empty values count as absent.

| Parameter | Meaning |
|---|---|
| `q` | Text search over name (EN/AR), SKU and category name. Up to 80 characters. |
| `category` | Category slug. |
| `sub` | Subcategory slug. |
| `sort` | `featured` (default), `newest`, `price-asc`, `price-desc`, `rating`. |
| `minPrice`, `maxPrice` | Range on the list price. |
| `page` | Page number, 1-based. |
| `pageSize` | Items per page: default 24, maximum 48. |

Only active products are ever listed. Out-of-stock pieces are listed as they are on the website, with an `availability` field. A page past the end returns an empty `products` array, so infinite scroll never repeats items.

### Store settings and shipping (public)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/settings` | | `paymentMethods` (`["COD"]` while Cash on Delivery is enabled, otherwise `[]`), `freeShippingThreshold`, WhatsApp/Instagram/TikTok links, announcement, returns policy (EN/AR), `siteUrl` |
| GET | `/shipping/zones` | | `{ zones: [{ governorate, governorateAr, fee, etaEn, etaAr, isCairo }], freeShippingThreshold }` |
| POST | `/shipping/quote` | `{ governorate, subtotal }` | `{ governorate, fee, isCairo, etaEn, etaAr, freeShippingApplied }`, the same calculation checkout uses |
| POST | `/promo/validate` | `{ code, subtotal }` | The website's endpoint: `{ valid, code?, discountAmount?, message? }` |
| POST | `/orders/lookup` | `{ orderNumber, phone }` | The website's guest tracking: `{ found, order? }`. Never includes delivery details. |

### Accounts

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | — | `{ name, email, phone?, password }` | `201` + `AuthSessionResponse` `{ token, tokenType: "Bearer", expiresAt, customer }` |
| POST | `/auth/login` | — | `{ email, password }` | `AuthSessionResponse` |
| POST | `/auth/forgot-password` | — | `{ email }` | `{ ok: true, code: "resetEmailSent", message }`, the same answer whether or not the email has an account |
| GET | `/me` | Bearer | | `{ customer: { id, email, name, phone, createdAt } }` |
| PATCH | `/me` | Bearer | `{ name, phone? }` | `{ customer }`. The email can't be changed. |
| POST | `/me/password` | Bearer | `{ currentPassword, newPassword, confirm }` | `{ token, tokenType, expiresAt }`. Every other session is signed out. |
| DELETE | `/me` | Bearer | `{ password }` | `{ deleted: true, ordersRetained }` (see [account-deletion.md](./account-deletion.md)) |

### Saved cart and wishlist

The cart and wishlist are stored on the server, so they follow the customer between the app and the website. The server rebuilds them from live product data on every read: current names, images and prices. It drops inactive products, and caps quantities at the available stock.

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/me/cart` | Bearer | | `{ cart: [{ productId, variantId, slug, nameEn, nameAr, image, unitPrice, quantity, variantLabel, maxStock }] }` |
| PUT | `/me/cart` | Bearer | `{ items: [{ productId, variantId \| null, quantity 1–99 }] }` (≤ 100 lines) | The saved cart, as `GET` returns it. Unknown products or variants are dropped. |
| GET | `/me/wishlist` | Bearer | | `{ wishlist: [{ productId, slug, nameEn, nameAr, image, price }] }` |
| PUT | `/me/wishlist` | Bearer | `{ productIds: string[] }` (≤ 200) | The saved wishlist |

### Checkout and orders

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/checkout` | optional Bearer | The website's checkout body (below) | `201` `{ orderNumber, total, paymentMethod: "COD", status, linkedToAccount }` |
| GET | `/me/orders` | Bearer | | `{ orders: OrderSummary[] }`: the customer's own orders, newest first, up to 50 |
| GET | `/me/orders/:orderNumber` | Bearer | | `{ order: OrderDetail }` with totals, delivery details and notes. `404` if it isn't the customer's. |

The checkout body:

```json
{
  "name": "…", "phone": "01XXXXXXXXX", "whatsapp": "", "email": "",
  "governorate": "Cairo", "city": "…", "address": "…", "buildingInfo": "", "notes": "",
  "paymentMethod": "COD", "promoCode": "",
  "items": [{ "productId": "…", "variantId": null, "quantity": 1 }]
}
```

- **Payment.** v1 supports **Cash on Delivery only**, matching the production configuration. `PAYMOB` is refused, and Paymob is neither called nor changed.
- **Pricing.** Prices, variant surcharges, promo discounts, shipping and stock are all recalculated on the server, exactly as the website's checkout does. The client sends only ids and quantities, and any other fields are ignored.
- **Account link.** With a valid token the order is linked to the account. Guest orders can still be tracked with `/orders/lookup`.
- **Private fields.** Order responses never include staff-only data such as internal notes or payment references.

## Testing

- **Unit tests** (`npm test`) cover the token rules: round trip, separation between the web and app audiences, expiry, wrong secret, wrong issuer, tampering, `alg: none`, and missing claims.
- **Integration tests** (`tests/mobile-api`, run with `npm run test:mobile-api`) call a running server over HTTP. They only run against a **local** database and a **local** server; the harness refuses anything else. They create their own fixtures and delete them afterwards.

To run them:

```sh
npm run build && npm start      # terminal 1, using the local .env
npm run test:mobile-api         # terminal 2
```
