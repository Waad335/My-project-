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
  ('musk',        'مسك',            'Musk',          1),
  ('perfumes',    'عطور',           'Perfume Oils',  2),
  ('lotion-oils', 'لوشن وزيوت',     'Lotion & Oils', 3),
  ('blusher',     'بلاشر',          'Blush',         4),
  ('candles',     'شموع',           'Candles',       5),
  ('mukhammaria', 'مخمريات',        'Body Mukhammaria', 6)
on conflict (slug) do update set name_ar = excluded.name_ar, name_en = excluded.name_en, sort_order = excluded.sort_order;

-- ---- Price corrections for products that already exist (the inserts below
-- use ON CONFLICT DO NOTHING, so they alone won't update an existing row's
-- price on re-run — this UPDATE is what actually corrects it there).
update public.products set price = case sku
  when 'ATH-BC-001' then 85.00
  when 'ATH-BC-002' then 100.00
  when 'ATH-BC-003' then 100.00
  when 'ATH-BLU-001' then 70.00
  when 'ATH-CND-003' then 150.00
  when 'ATH-CND-004' then 150.00
  when 'ATH-CND-005' then 100.00
end
where sku in ('ATH-BC-001', 'ATH-BC-002', 'ATH-BC-003', 'ATH-BLU-001', 'ATH-CND-003', 'ATH-CND-004', 'ATH-CND-005');

-- ---- Move the four 20ml Kiayali/Yara/Melon products into the new
-- مخمريات (Body Mukhammaria) category and set their price to 85 EGP.
-- Kept as their own SKUs/slugs/names/images — only category + price change.
update public.products
set category_id = (select id from public.categories where slug = 'mukhammaria'),
    price = 85.00
where sku in ('ATH-LO-001', 'ATH-LO-002', 'ATH-LO-003', 'ATH-LO-004');

-- ---- Remove العناية بالجسم (Body Care) — merge its 3 products into لوشن وزيوت.
-- Prices are unchanged, only the category assignment moves; the category
-- row itself is dropped once nothing references it.
update public.products
set category_id = (select id from public.categories where slug = 'lotion-oils')
where sku in ('ATH-BC-001', 'ATH-BC-002', 'ATH-BC-003');

delete from public.categories
where slug = 'body-care'
  and not exists (select 1 from public.products p where p.category_id = categories.id);

-- ---- ex-"Body Care" products, now filed under لوشن وزيوت (Lotion & Oils) -------
-- SKU prefix (ATH-BC-) kept as-is (unchanged identifiers/slugs/images/prices),
-- only the category changed — the العناية بالجسم category was removed.
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, size, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-BC-001', 'sugar-touch-body-lotion', 'لوشن الجسم - لمسة السكر', 'Sugar Touch Body Lotion',
   'لوشن جسم بلمسة ناعمة ورائحة حلوة، يمنح البشرة إحساسًا بالنعومة والانتعاش.', 'A soft-touch body lotion with a sweet scent that leaves skin smooth and refreshed.',
   85.00, null, null, (select id from public.categories where slug='lotion-oils'), 30, true, true, false, true),
  ('ATH-BC-002', 'dry-oil-mid-night', 'زيت جاف ميد نايت', 'Dry Oil — Mid Night',
   'زيت جاف خفيف بلمسة ناعمة ولمعان جذاب، مناسب للعناية بالبشرة وإضفاء توهج أنيق.', 'A light dry oil with a soft finish and an attractive shimmer — perfect for skin care and an elegant glow.',
   100.00, null, null, (select id from public.categories where slug='lotion-oils'), 24, false, true, false, true),
  ('ATH-BC-003', 'dry-oil-yara-candy', 'زيت جاف يارا كاندي', 'Dry Oil — Yara Candy',
   'زيت جاف برائحة حلوة وناعمة، يمنح البشرة لمسة حريرية ولمعانًا جذابًا بدون إحساس دهني ثقيل.', 'A dry oil with a sweet, soft scent that gives skin a silky touch and an attractive shine without feeling heavy.',
   100.00, null, null, (select id from public.categories where slug='lotion-oils'), 22, false, false, false, true)
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

-- ---- Mukhammaria (مخمريات) — 20ml — moved out of لوشن وزيوت at 85 EGP each --------
-- SKU prefix (ATH-LO-) kept as-is (unchanged identifiers/slugs/images), only the
-- category and price actually changed.
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, size, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-LO-001', 'kiayali-vanilla', 'كايالي فانيلا', 'Kiayali Vanilla',
   'رائحة فانيلا دافئة وحلوة تمنح إحساسًا ناعمًا ومريحًا.', 'A warm, sweet vanilla scent that gives a soft, comforting feel.',
   85.00, null, '20ml', (select id from public.categories where slug='mukhammaria'), 16, true, false, true, true),
  ('ATH-LO-002', 'kiayali-marshmallow', 'كايالي مارشميلو', 'Kiayali Marshmallow',
   'رائحة حلوة وناعمة بطابع كريمي وسكري.', 'A sweet, soft scent with a creamy, sugary character.',
   85.00, null, '20ml', (select id from public.categories where slug='mukhammaria'), 15, false, false, false, true),
  ('ATH-LO-003', 'yara-candy-20ml', 'يارا كاندي', 'Yara Candy',
   'رائحة حلوة وفاكهية وناعمة لمحبي الروائح السكرية.', 'A sweet, fruity, soft scent for lovers of sugary fragrances.',
   85.00, null, '20ml', (select id from public.categories where slug='mukhammaria'), 14, false, true, false, true),
  ('ATH-LO-004', 'melon', 'ميلون', 'Melon',
   'رائحة منعشة وفاكهية مستوحاة من الشمام، بطابع حلو وخفيف.', 'A refreshing, fruity scent inspired by melon, with a sweet and light character.',
   85.00, null, '20ml', (select id from public.categories where slug='mukhammaria'), 17, false, false, false, true)
on conflict (sku) do nothing;

-- ---- Blush (بلاشر) — 5ml ---------------------------------------------------------
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, size, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-BLU-001', 'baby-bloom-blush', 'بلاشر بيبي بلوم', 'Baby Bloom Blush',
   'بلاشر سائل بلمسة ناعمة ولون جذاب، مناسب لإطلالة طبيعية ومشرقة.', 'A liquid blush with a soft touch and an attractive shade — perfect for a natural, radiant look.',
   70.00, null, '5ml', (select id from public.categories where slug='blusher'), 20, true, true, false, true)
on conflict (sku) do nothing;

-- ---- Candles (شموع) ---------------------------------------------------------------
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, size, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-CND-001', 'candle-lemon', 'شمعة ليمون', 'ATHAR Lemon',
   'مزيج طبيعي راقٍ برائحة الليمون المنعشة، لإنعاش حواسك وأجواء منزلك.', 'A refined natural blend with a refreshing lemon scent to awaken your senses.',
   150.00, null, null, (select id from public.categories where slug='candles'), 15, true, true, false, true),
  ('ATH-CND-002', 'candle-coffee', 'شمعة قهوة', 'ATHAR Coffee',
   'شمعة معطرة بعبق القهوة الغنية والكاكاو، لإيقاظ حواسك.', 'A candle scented with rich coffee and cacao notes to awaken the senses.',
   150.00, null, null, (select id from public.categories where slug='candles'), 15, false, false, false, true),
  ('ATH-CND-003', 'candle-sea', 'الشمعة البحرية', 'Sea Candle',
   'شمعة حرفية يدوية الصنع بزيوت عطرية بحرية فاخرة، تمنح السكينة والهدوء.', 'A handcrafted candle with luxurious sea-inspired notes that bring calm and serenity.',
   150.00, null, null, (select id from public.categories where slug='candles'), 10, true, false, false, true),
  ('ATH-CND-004', 'candle-fruits', 'شمعة الفواكه', 'ATHAR Fruits',
   'شمعة تحمل عبق الفواكه المنعشة بمزيج غني ومميز.', 'A candle carrying a fresh, rich blend of fruity notes.',
   150.00, null, null, (select id from public.categories where slug='candles'), 10, false, true, false, true),
  ('ATH-CND-005', 'candle-strawberry', 'سحر الفراولة', 'Strawberry Magic',
   'رائحة غنية وتصميم فريد، تجربة تأخذك بعيداً مع سحر الفراولة.', 'A rich scent and a unique design — an experience that takes you away with the magic of strawberry.',
   100.00, null, null, (select id from public.categories where slug='candles'), 12, false, false, false, true),
  ('ATH-CND-006', 'candle-satin', 'ساتان - فانيليا وجوز الهند', 'SATIN — Vanilla & Coconut',
   'شمعة فانيليا وجوز الهند متعددة الاستخدامات، لترطيب وتعطير الجسم والجو.', 'A multi-use vanilla and coconut candle for moisturizing and scenting the body and your space.',
   100.00, null, null, (select id from public.categories where slug='candles'), 18, true, false, true, true)
on conflict (sku) do nothing;

-- ---- product_images: real ATHAR product photos, one per product ---------------
-- Files live at assets/img/products/<slug>.jpg (added directly to the repo).
-- Re-running this block replaces any previously-seeded image for these 21
-- products (e.g. the old shared category placeholders) with the real photo,
-- without touching images you've since uploaded yourself for other products.
delete from public.product_images
where sort_order = 0
  and product_id in (select id from public.products where slug in (
    'sugar-touch-body-lotion', 'dry-oil-mid-night', 'dry-oil-yara-candy',
    'musk-marshmallow', 'musk-cheesecake', 'musk-fruit-mix', 'musk-blueberry', 'musk-tahara',
    'red-candy', 'blue-velvet',
    'kiayali-vanilla', 'kiayali-marshmallow', 'yara-candy-20ml', 'melon',
    'baby-bloom-blush',
    'candle-lemon', 'candle-coffee', 'candle-sea', 'candle-fruits', 'candle-strawberry', 'candle-satin'
  ));

insert into public.product_images (product_id, image_url, sort_order)
select p.id, 'assets/img/products/' || p.slug || '.jpg', 0
from public.products p
where p.slug in (
  'sugar-touch-body-lotion', 'dry-oil-mid-night', 'dry-oil-yara-candy',
  'musk-marshmallow', 'musk-cheesecake', 'musk-fruit-mix', 'musk-blueberry', 'musk-tahara',
  'red-candy', 'blue-velvet',
  'kiayali-vanilla', 'kiayali-marshmallow', 'yara-candy-20ml', 'melon',
  'baby-bloom-blush',
  'candle-lemon', 'candle-coffee', 'candle-sea', 'candle-fruits', 'candle-strawberry', 'candle-satin'
)
and not exists (select 1 from public.product_images pi where pi.product_id = p.id and pi.sort_order = 0);

-- SATIN has a second angle (texture/open-jar shot) as an extra gallery image.
insert into public.product_images (product_id, image_url, sort_order)
select p.id, 'assets/img/products/candle-satin-2.jpg', 1
from public.products p
where p.slug = 'candle-satin'
and not exists (select 1 from public.product_images pi where pi.product_id = p.id and pi.sort_order = 1);
