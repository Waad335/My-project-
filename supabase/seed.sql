-- =============================================================================
-- ATHAR | أثر — Seed Data
-- Run AFTER schema.sql. Inserts the real ATHAR catalog (Alexandria, Egypt —
-- musk, perfume oils, body care, lotion & oils, blush). Prices are in EGP.
--
-- Safe to re-run. If you previously ran an older version of this file (the
-- old placeholder jewelry/accessories catalog — مسكات / Body Splash / سلاسل
-- يدوية), the block below removes that old seed data first so it doesn't sit
-- alongside the real catalog. Anything you've since added/edited yourself
-- from the Admin Dashboard (different SKUs) is left untouched.
-- =============================================================================

-- ---- 1. Clean up the old placeholder catalog (safe no-op if never run) ------
delete from public.product_images
where product_id in (
  select id from public.products
  where sku like 'ATH-HND-%' or sku like 'ATH-BSP-%'
     or sku like 'ATH-CHN-%' or sku like 'ATH-BLS-%'
);
delete from public.products
where sku like 'ATH-HND-%' or sku like 'ATH-BSP-%'
   or sku like 'ATH-CHN-%' or sku like 'ATH-BLS-%';

delete from public.categories
where slug in ('handles', 'body-splash', 'handmade-chains')
  and not exists (select 1 from public.products p where p.category_id = categories.id);

-- Fix store contact info if it was already inserted with the old Saudi defaults
-- (a fresh install already gets the right defaults straight from schema.sql).
update public.store_settings
set contact_phone = '01214856903',
    whatsapp_number = '01214856903',
    address = 'الإسكندرية، مصر'
where id = 1
  and (contact_phone = '+966500000000' or whatsapp_number = '+966500000000' or address like '%السعودية%');

-- ---- 2. Categories (matches schema.sql; safe to re-run) ---------------------
insert into public.categories (slug, name_ar, name_en, sort_order) values
  ('body-care',   'العناية بالجسم', 'Body Care',     1),
  ('musk',        'مسك',            'Musk',          2),
  ('perfumes',    'عطور',           'Perfume Oils',  3),
  ('lotion-oils', 'لوشن وزيوت',     'Lotion & Oils', 4),
  ('blusher',     'بلاشر',          'Blush',         5)
on conflict (slug) do update set name_ar = excluded.name_ar, name_en = excluded.name_en, sort_order = excluded.sort_order;

-- ---- Body Care (العناية بالجسم) ----------------------------------------------
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, size, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-BC-001', 'sugar-touch-body-lotion', 'لوشن الجسم - لمسة السكر', 'Sugar Touch Body Lotion',
   'لوشن جسم بلمسة ناعمة ورائحة حلوة، يمنح البشرة إحساسًا بالنعومة والانتعاش.', 'A soft-touch body lotion with a sweet scent that leaves skin smooth and refreshed.',
   180.00, null, null, (select id from public.categories where slug='body-care'), 30, true, true, false, true),
  ('ATH-BC-002', 'dry-oil-mid-night', 'زيت جاف ميد نايت', 'Dry Oil — Mid Night',
   'زيت جاف خفيف بلمسة ناعمة ولمعان جذاب، مناسب للعناية بالبشرة وإضفاء توهج أنيق.', 'A light dry oil with a soft finish and an attractive shimmer — perfect for skin care and an elegant glow.',
   190.00, null, null, (select id from public.categories where slug='body-care'), 24, false, true, false, true),
  ('ATH-BC-003', 'dry-oil-yara-candy', 'زيت جاف يارا كاندي', 'Dry Oil — Yara Candy',
   'زيت جاف برائحة حلوة وناعمة، يمنح البشرة لمسة حريرية ولمعانًا جذابًا بدون إحساس دهني ثقيل.', 'A dry oil with a sweet, soft scent that gives skin a silky touch and an attractive shine without feeling heavy.',
   190.00, null, null, (select id from public.categories where slug='body-care'), 22, false, false, false, true)
on conflict (sku) do nothing;

-- ---- Musk (مسك) — 6g -----------------------------------------------------------
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, size, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-MSK-001', 'musk-marshmallow', 'مسك مارشميلو', 'Musk Marshmallow',
   'رائحة حلوة وناعمة مستوحاة من المارشميلو، مناسبة لمحبي الروائح السكرية الناعمة.', 'A sweet, soft scent inspired by marshmallow — perfect for lovers of gentle sugary fragrances.',
   70.00, null, '6g', (select id from public.categories where slug='musk'), 40, true, false, true, true),
  ('ATH-MSK-002', 'musk-cheesecake', 'مسك تشيز كيك', 'Musk Cheesecake',
   'رائحة حلوة ودافئة بطابع كريمي وسكري مميز.', 'A warm, sweet scent with a distinctive creamy, sugary character.',
   70.00, null, '6g', (select id from public.categories where slug='musk'), 38, false, true, false, true),
  ('ATH-MSK-003', 'musk-fruit-mix', 'مسك فروت ميكس', 'Musk Fruit Mix',
   'مزيج فاكهي منعش وحلو بطابع مشرق ومميز.', 'A refreshing, sweet fruity blend with a bright, distinctive character.',
   70.00, null, '6g', (select id from public.categories where slug='musk'), 35, false, false, true, true),
  ('ATH-MSK-004', 'musk-blueberry', 'مسك بلوبيري', 'Musk Blueberry',
   'رائحة فاكهية ناعمة بطابع التوت الأزرق مع لمسة منعشة.', 'A soft fruity scent with a blueberry character and a refreshing touch.',
   70.00, null, '6g', (select id from public.categories where slug='musk'), 33, false, false, false, true),
  ('ATH-MSK-005', 'musk-tahara', 'مسك الطهارة', 'Musk Tahara',
   'رائحة نظيفة وناعمة ومنعشة بطابع أنيق.', 'A clean, soft, refreshing scent with an elegant character.',
   65.00, null, '6g', (select id from public.categories where slug='musk'), 45, true, false, false, true)
on conflict (sku) do nothing;

-- ---- Perfume Oils (عطور) — 10ml -------------------------------------------------
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, size, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-PRF-001', 'red-candy', 'ريد كاندي', 'Red Candy',
   'رائحة حلوة وفاكهية بطابع جذاب ومميز.', 'A sweet, fruity scent with an attractive, distinctive character.',
   160.00, null, '10ml', (select id from public.categories where slug='perfumes'), 20, true, true, false, true),
  ('ATH-PRF-002', 'blue-velvet', 'بلو فيلفت', 'Blue Velvet',
   'رائحة أنيقة وعميقة بطابع فاخر ومميز.', 'An elegant, deep scent with a luxurious, distinctive character.',
   160.00, null, '10ml', (select id from public.categories where slug='perfumes'), 18, false, true, false, true)
on conflict (sku) do nothing;

-- ---- Lotion & Oils (لوشن وزيوت) — 20ml ------------------------------------------
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, size, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-LO-001', 'kiayali-vanilla', 'كايالي فانيلا', 'Kiayali Vanilla',
   'رائحة فانيلا دافئة وحلوة تمنح إحساسًا ناعمًا ومريحًا.', 'A warm, sweet vanilla scent that gives a soft, comforting feel.',
   220.00, null, '20ml', (select id from public.categories where slug='lotion-oils'), 16, true, false, true, true),
  ('ATH-LO-002', 'kiayali-marshmallow', 'كايالي مارشميلو', 'Kiayali Marshmallow',
   'رائحة حلوة وناعمة بطابع كريمي وسكري.', 'A sweet, soft scent with a creamy, sugary character.',
   220.00, null, '20ml', (select id from public.categories where slug='lotion-oils'), 15, false, false, false, true),
  ('ATH-LO-003', 'yara-candy-20ml', 'يارا كاندي', 'Yara Candy',
   'رائحة حلوة وفاكهية وناعمة لمحبي الروائح السكرية.', 'A sweet, fruity, soft scent for lovers of sugary fragrances.',
   220.00, null, '20ml', (select id from public.categories where slug='lotion-oils'), 14, false, true, false, true),
  ('ATH-LO-004', 'melon', 'ميلون', 'Melon',
   'رائحة منعشة وفاكهية مستوحاة من الشمام، بطابع حلو وخفيف.', 'A refreshing, fruity scent inspired by melon, with a sweet and light character.',
   210.00, null, '20ml', (select id from public.categories where slug='lotion-oils'), 17, false, false, false, true)
on conflict (sku) do nothing;

-- ---- Blush (بلاشر) — 5ml ---------------------------------------------------------
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, size, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-BLU-001', 'baby-bloom-blush', 'بلاشر بيبي بلوم', 'Baby Bloom Blush',
   'بلاشر سائل بلمسة ناعمة ولون جذاب، مناسب لإطلالة طبيعية ومشرقة.', 'A liquid blush with a soft touch and an attractive shade — perfect for a natural, radiant look.',
   140.00, null, '5ml', (select id from public.categories where slug='blusher'), 20, true, true, false, true)
on conflict (sku) do nothing;

-- ---- product_images: one placeholder image per product ------------------------
-- Replace these with real product photos any time from the Admin Dashboard
-- (edit the product → upload images). Placeholder SVGs ship with the site
-- under assets/img/products/ and are mapped here by category as a starting point.
insert into public.product_images (product_id, image_url, sort_order)
select p.id,
  case c.slug
    when 'body-care'    then 'assets/img/products/body-splash-placeholder.svg'
    when 'musk'          then 'assets/img/products/handles-placeholder.svg'
    when 'perfumes'      then 'assets/img/products/handmade-chains-placeholder.svg'
    when 'lotion-oils'   then 'assets/img/products/body-splash-placeholder.svg'
    when 'blusher'       then 'assets/img/products/blusher-placeholder.svg'
  end,
  0
from public.products p
join public.categories c on c.id = p.category_id
where (p.sku like 'ATH-BC-%' or p.sku like 'ATH-MSK-%' or p.sku like 'ATH-PRF-%'
   or p.sku like 'ATH-LO-%' or p.sku like 'ATH-BLU-%')
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);
