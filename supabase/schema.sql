-- =============================================================================
-- ATHAR | أثر — Database Schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.
-- =============================================================================

create extension if not exists "pgcrypto";

-- =============================================================================
-- TABLES
-- =============================================================================

-- ---- categories ----------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,               -- e.g. 'musk', 'perfumes'
  name_ar     text not null,
  name_en     text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---- products --------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  sku              text not null unique,
  slug             text not null unique,
  name_ar          text not null,
  name_en          text,
  description_ar   text,
  description_en   text,
  price            numeric(10,2) not null check (price >= 0),
  discount_price   numeric(10,2) check (discount_price is null or discount_price >= 0),
  size             text,                                -- e.g. '6g', '10ml', '20ml' — optional, shown on card + detail page
  category_id      uuid references public.categories(id) on delete restrict,
  stock_quantity   integer not null default 0 check (stock_quantity >= 0),
  is_featured      boolean not null default false,
  is_new_arrival   boolean not null default false,
  is_bestseller    boolean not null default false,
  is_available     boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint discount_lower_than_price check (discount_price is null or discount_price <= price)
);

-- Safety net for projects that ran an earlier version of this schema before the `size` column existed.
alter table public.products add column if not exists size text;

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_featured on public.products(is_featured) where is_featured = true;
create index if not exists idx_products_new on public.products(is_new_arrival) where is_new_arrival = true;
create index if not exists idx_products_bestseller on public.products(is_bestseller) where is_bestseller = true;
create index if not exists idx_products_available on public.products(is_available);

-- ---- product_images ---------------------------------------------------------
create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  image_url   text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_product_images_product on public.product_images(product_id);

-- ---- profiles (extends auth.users; row is created automatically on signup) --
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- orders -----------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default ('ATH-' || nextval('public.order_number_seq')::text),
  customer_name    text not null,
  customer_phone   text not null,
  customer_email   text,
  country          text not null,
  city             text not null,
  address          text not null,
  notes            text,
  subtotal         numeric(10,2) not null check (subtotal >= 0),
  shipping         numeric(10,2) not null default 0 check (shipping >= 0),
  total            numeric(10,2) not null check (total >= 0),
  payment_method   text not null default 'cod' check (payment_method in ('cod', 'card')),
  status           text not null default 'pending'
                     check (status in ('pending','confirmed','preparing','shipped','delivered','cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);

-- ---- order_items --------------------------------------------------------------
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,      -- snapshot, survives product edits/deletes
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  quantity      integer not null check (quantity > 0),
  line_total    numeric(10,2) not null check (line_total >= 0)
);

create index if not exists idx_order_items_order on public.order_items(order_id);

-- ---- wishlist (guest-friendly, keyed by a client-generated session id) -------
create table if not exists public.wishlist (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (session_id, product_id)
);

create index if not exists idx_wishlist_session on public.wishlist(session_id);

-- ---- store_settings (single row, admin-editable, powers checkout shipping) --
create table if not exists public.store_settings (
  id                      int primary key default 1 check (id = 1),  -- enforce a single row
  store_name              text not null default 'أثر ATHAR',
  contact_email           text not null default 'hello@athar-store.com',
  contact_phone           text not null default '01214856903',
  whatsapp_number         text not null default '01214856903',
  address                 text not null default 'الإسكندرية، مصر',
  shipping_flat_rate      numeric(10,2) not null default 25 check (shipping_flat_rate >= 0),
  free_shipping_threshold numeric(10,2) not null default 300 check (free_shipping_threshold >= 0),
  updated_at              timestamptz not null default now()
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- updated_at maintenance -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_store_settings_updated_at on public.store_settings;
create trigger trg_store_settings_updated_at before update on public.store_settings
  for each row execute procedure public.set_updated_at();

-- ---- automatic stock decrement on checkout -----------------------------------
-- Guest checkout inserts order_items with the anon key, which has no UPDATE
-- grant on products (see RLS below) — so stock can't be decremented from the
-- client. This SECURITY DEFINER trigger does it server-side instead, safely,
-- the moment an order line is created.
create or replace function public.decrement_product_stock()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.product_id is not null then
    update public.products
    set stock_quantity = greatest(stock_quantity - new.quantity, 0)
    where id = new.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_decrement_stock on public.order_items;
create trigger trg_decrement_stock after insert on public.order_items
  for each row execute procedure public.decrement_product_stock();

-- =============================================================================
-- HELPER: is_admin() — used inside RLS policies, SECURITY DEFINER avoids
-- recursive-RLS issues when a policy needs to check the profiles table.
-- =============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.profiles       enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.wishlist       enable row level security;
alter table public.store_settings enable row level security;

-- ---- categories: public read, admin write ------------------------------------
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- products: public read only available ones, admin full access -----------
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (is_available = true or public.is_admin());

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for insert with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products
  for delete using (public.is_admin());

-- ---- product_images: public read, admin write --------------------------------
drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images
  for select using (true);

drop policy if exists "product_images_admin_write" on public.product_images;
create policy "product_images_admin_write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- profiles: user reads own row, admin reads/writes all --------------------
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- orders: anyone can place an order (insert only); only admin can read/manage --
drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert" on public.orders
  for insert with check (true);

drop policy if exists "orders_admin_read" on public.orders;
create policy "orders_admin_read" on public.orders
  for select using (public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- ---- order_items: same shape as orders ----------------------------------------
drop policy if exists "order_items_public_insert" on public.order_items;
create policy "order_items_public_insert" on public.order_items
  for insert with check (true);

drop policy if exists "order_items_admin_read" on public.order_items;
create policy "order_items_admin_read" on public.order_items
  for select using (public.is_admin());

-- ---- wishlist: guest-session read/write (no sensitive data involved) ---------
drop policy if exists "wishlist_public_all" on public.wishlist;
create policy "wishlist_public_all" on public.wishlist
  for all using (true) with check (true);

-- ---- store_settings: public read (checkout needs shipping rates), admin write --
drop policy if exists "store_settings_public_read" on public.store_settings;
create policy "store_settings_public_read" on public.store_settings
  for select using (true);

drop policy if exists "store_settings_admin_write" on public.store_settings;
create policy "store_settings_admin_write" on public.store_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- STORAGE — product images bucket
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_bucket_public_read" on storage.objects;
create policy "product_images_bucket_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_bucket_admin_write" on storage.objects;
create policy "product_images_bucket_admin_write" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_bucket_admin_update" on storage.objects;
create policy "product_images_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_bucket_admin_delete" on storage.objects;
create policy "product_images_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- =============================================================================
-- SEED: categories (required by product seed data — see seed.sql)
-- =============================================================================
insert into public.categories (slug, name_ar, name_en, sort_order) values
  ('body-care',   'العناية بالجسم', 'Body Care',     1),
  ('musk',        'مسك',            'Musk',          2),
  ('perfumes',    'عطور',           'Perfume Oils',  3),
  ('lotion-oils', 'لوشن وزيوت',     'Lotion & Oils', 4),
  ('blusher',     'بلاشر',          'Blush',         5),
  ('candles',     'شموع',           'Candles',       6)
on conflict (slug) do nothing;

-- =============================================================================
-- MAKE YOURSELF THE FIRST ADMIN
-- =============================================================================
-- 1. Sign up a user from admin/index.html (or Supabase Dashboard → Authentication → Add user).
-- 2. Then run, replacing the email:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- =============================================================================
