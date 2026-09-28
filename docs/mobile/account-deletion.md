# Customer account deletion — v1 behavior

A signed-in customer can delete their account from the app with `DELETE /api/mobile/v1/me`, confirming with their current password. This document describes exactly what is deleted and what is kept. It must be reviewed, and the open decisions at the end settled, before the app is submitted to the App Store or Google Play.

Implementation: `deleteCustomerAccount()` in `src/lib/customer-accounts.ts`. It runs as a single database transaction, so it either completes entirely or changes nothing. Tests: `tests/mobile-api/account-deletion.test.ts`.

## Safeguards

- It needs a valid app token **and** the account's current password. A wrong password returns `403` and changes nothing.
- Attempts are limited to 5 per 15 minutes per account.
- It only ever affects the signed-in customer's own account.

## Deleted

| Data | Table | How |
|---|---|---|
| The account: email, password hash, name, phone, session version, timestamps | `users` | Deleted |
| Saved wishlist | `wishlist` | Deleted with the account (database cascade) |
| Saved cart | `cart_items` | Deleted with the account (database cascade) |
| Password-reset tokens (hashed) | `password_reset_tokens` | Deleted with the account (database cascade) |
| Newsletter subscription **for the account's email** | `newsletter_subscribers` | Deleted |

Effects:

- **Signed out everywhere.** Every website session and app token for the account stops working immediately, because the user they point to no longer exists.
- **Old credentials stop working.** The email and password can no longer sign in.
- **The email is free again.** It can register a new account later. That new account starts empty and is **not** reconnected to the old orders.

## Retained (business and accounting records)

| Data | Table | What happens |
|---|---|---|
| Orders placed while signed in | `orders` (with `order_items`, `payments`) | **Kept.** The link to the account (`orders.userId`) is set to empty, so the order no longer belongs to any account. |
| Delivery details given at checkout: name, phone, WhatsApp, email, governorate, city, address, building info, delivery notes | `customers` (one row per order) and the address fields on `orders` | **Kept** unchanged, as part of the order record. |
| Order contents: product name, SKU, image and variant snapshots, prices, quantities, totals, discounts, shipping fee, promo code used | `orders`, `order_items` | **Kept** unchanged. |
| Staff notes and order status | `orders.internalNotes`, `orders.status` | **Kept** unchanged. |

Why these are kept:

- orders are needed for fulfilment, returns and refunds;
- they are needed for accounting and tax records;
- they back the admin dashboard's sales figures.

A retained order can still be tracked with its order number and delivery phone through the website's "Track order" page. That page never shows the delivery address.

## Not affected

- **Guest orders** placed without signing in were never linked to the account, so they are unchanged.
- **Newsletter subscriptions under a different email** are not connected to the account and are not removed.
- **Admin and staff accounts** (`admin_users`) are a separate system and are never touched.
- **Other customers' data** is never touched. The tests check this.

## Outside the database

- **Password-reset emails** already delivered are in the customer's mailbox. If an email provider is configured (`RESEND_API_KEY`), it keeps its own delivery logs under its own retention settings.
- **Hosting request logs** (IP addresses, paths) are kept by the hosting provider under its own retention settings.
- **The app** must discard its token and any cached account data once deletion succeeds (a requirement for the Phase 2 app), so no copy of the account stays on the device.

## Open decisions before release

1. **Retention period for order records.** Decide how long retained orders and their delivery snapshots are kept, based on legal and accounting advice. Also decide whether the name, phone and address are anonymized after that period. v1 keeps them indefinitely.
2. **Website parity.** The website has no "delete my account" option yet; deletion exists only in the mobile API. Google Play requires a web page where users can request account deletion without the app. Apple requires deletion inside the app, which v1 provides. Plan a website entry point or request page before the Play submission. That is a website change, so it needs separate approval.
3. **Privacy policy.** The website's privacy page should describe this deletion and retention behavior before release.
4. **Requests about guest orders.** Decide how requests to erase data from guest orders, or from retained orders, are handled. Today this would be a manual admin task.
