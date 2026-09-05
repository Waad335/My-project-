# ATHAR — Supabase Setup

Follow these steps once to stand up the real backend for the store.

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) → **New Project** (the free tier is enough to get started).
2. Wait for provisioning to finish (~2 minutes).

## 2. Run the schema

1. In your Supabase project, open **SQL Editor → New query**.
2. Paste the entire contents of [`schema.sql`](./schema.sql) and click **Run**.
   This creates all tables (`categories`, `products`, `product_images`, `profiles`, `orders`, `order_items`, `wishlist`), the `is_admin()` helper, Row Level Security policies, and a public `product-images` Storage bucket.
3. Open a new query, paste [`seed.sql`](./seed.sql), and click **Run**.
   This adds 20 realistic placeholder products (5 per category) so the storefront isn't empty on first load.

## 3. Create your admin account

1. Go to **Authentication → Users → Add user** (or sign up from `admin/index.html` once the site is wired up).
2. Note the email you used.
3. Back in **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   Replace the email with the one you signed up with. This is what unlocks the Admin Dashboard for that account — every other account defaults to `role = 'customer'` and has no write access.

## 4. Get your API keys

Go to **Project Settings → API**. You need two values:

- **Project URL** (e.g. `https://xxxxxxxx.supabase.co`)
- **`anon` `public` key** (safe to use in frontend code — it has no power on its own; every table is protected by the RLS policies from step 2)

**Never use the `service_role` key in any file that ships to the browser.** It bypasses RLS entirely and must stay out of this repository.

## 5. Wire it into the site

Open [`../js/supabase-config.js`](../js/supabase-config.js) and fill in the two values from step 4:

```js
window.ATHAR_SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
window.ATHAR_SUPABASE_ANON_KEY = 'your-anon-public-key';
```

Save, reload any page, and the storefront will start reading live data from Supabase.

## What's protected

| Action | Public / anon | Signed-in admin |
|---|---|---|
| Browse available products & categories | ✅ | ✅ |
| See unavailable/out-of-stock-hidden products | ❌ | ✅ |
| Place an order (checkout) | ✅ (insert only) | ✅ |
| View / update any order | ❌ | ✅ |
| Create / edit / delete products | ❌ | ✅ |
| Upload product images | ❌ | ✅ |

Enforced server-side by Postgres Row Level Security — not just hidden in the UI.
