-- =============================================================================
-- ATHAR | أثر — Seed Data
-- Run AFTER schema.sql. Inserts 20 realistic placeholder products (5 per
-- category) so the store has something to browse immediately. Every seed
-- product's image points at a local SVG placeholder shipped with the site
-- (assets/img/products/*.svg) — replace any of this at any time from the
-- Admin Dashboard: edit the product, upload real photos, adjust price/stock,
-- or simply delete the seed row and add your real product instead.
-- Safe to re-run: uses ON CONFLICT (sku) DO NOTHING.
-- =============================================================================

-- ---- Handles (مسكات) ---------------------------------------------------------
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-HND-001', 'handle-gold-touch', 'مسكة "لمسة ذهب"', 'Gold Touch Handle',
   'مسكة أنيقة مطلية بالذهب، تصميم دائري بسيط يليق بجميع الإطلالات.', 'An elegant gold-plated handle with a minimal circular design.',
   185.00, null, (select id from public.categories where slug='handles'), 24, true, false, true, true),
  ('ATH-HND-002', 'handle-athar-flower', 'مسكة "زهرة الأثر"', 'Athar Flower Handle',
   'مسكة مستوحاة من تفتّح الزهور، بتفاصيل يدوية دقيقة.', 'Inspired by a blooming flower, finished with delicate handmade detailing.',
   165.00, 145.00, (select id from public.categories where slug='handles'), 18, false, true, false, true),
  ('ATH-HND-003', 'handle-moon', 'مسكة "القمر"', 'Moon Handle',
   'تصميم هلالي أنيق بلمسة عصرية.', 'An elegant crescent-inspired design with a modern finish.',
   210.00, null, (select id from public.categories where slug='handles'), 12, false, false, false, true),
  ('ATH-HND-004', 'handle-royal-pearl', 'مسكة "اللؤلؤة الملكية"', 'Royal Pearl Handle',
   'مسكة مرصّعة بلؤلؤة صناعية فاخرة، مثالية للمناسبات.', 'Set with a single lustrous faux pearl — perfect for special occasions.',
   225.00, null, (select id from public.categories where slug='handles'), 9, true, false, false, true),
  ('ATH-HND-005', 'handle-desert-rose', 'مسكة "وردة الصحراء"', 'Desert Rose Handle',
   'تصميم مستوحى من وردة الصحراء بلمسة ذهبية دافئة.', 'A warm gold-toned design inspired by the desert rose.',
   175.00, null, (select id from public.categories where slug='handles'), 0, false, false, false, false)
on conflict (sku) do nothing;

-- ---- Body Splash --------------------------------------------------------------
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-BSP-001', 'splash-royal-jasmine', 'عبير الياسمين الملكي', 'Royal Jasmine Splash',
   'رذاذ جسم بعبير الياسمين الفاخر، منعش ويدوم طويلاً.', 'A refreshing, long-lasting body splash with luxurious jasmine notes.',
   140.00, 120.00, (select id from public.categories where slug='body-splash'), 40, true, false, true, true),
  ('ATH-BSP-002', 'splash-luxury-rose', 'عبير الورد الفاخر', 'Luxury Rose Splash',
   'مزيج دافئ من الورد الطبيعي والمسك الأبيض.', 'A warm blend of natural rose and white musk.',
   150.00, null, (select id from public.categories where slug='body-splash'), 33, false, true, false, true),
  ('ATH-BSP-003', 'splash-warm-amber', 'عبير العنبر الدافئ', 'Warm Amber Splash',
   'عبير شرقي دافئ بلمسة العنبر والفانيليا.', 'An oriental, warm scent layered with amber and vanilla.',
   160.00, null, (select id from public.categories where slug='body-splash'), 27, false, false, true, true),
  ('ATH-BSP-004', 'splash-white-musk', 'عبير المسك الأبيض', 'White Musk Splash',
   'نقاء المسك الأبيض بتركيبة ناعمة على البشرة.', 'The purity of white musk in a gentle, skin-friendly formula.',
   135.00, null, (select id from public.categories where slug='body-splash'), 21, false, false, false, true),
  ('ATH-BSP-005', 'splash-oud-blossom', 'عبير العود والزهور', 'Oud Blossom Splash',
   'مزيج فاخر بين العود الأصيل وباقة الزهور البيضاء.', 'A rich fusion of authentic oud and a white floral bouquet.',
   170.00, null, (select id from public.categories where slug='body-splash'), 15, true, false, false, true)
on conflict (sku) do nothing;

-- ---- Blusher --------------------------------------------------------------------
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-BLS-001', 'blusher-athar-rose', 'بلاشر "وردة أثر"', 'Athar Rose Blusher',
   'بلاشر بودرة ناعم بلون وردي طبيعي يمنح إشراقة فورية.', 'A silky powder blusher in a natural rose shade for an instant glow.',
   95.00, null, (select id from public.categories where slug='blusher'), 30, true, false, true, true),
  ('ATH-BLS-002', 'blusher-soft-peach', 'بلاشر "خوخي ناعم"', 'Soft Peach Blusher',
   'لون خوخي دافئ يناسب جميع درجات البشرة.', 'A warm peach shade that flatters every skin tone.',
   90.00, 75.00, (select id from public.categories where slug='blusher'), 22, false, true, false, true),
  ('ATH-BLS-003', 'blusher-golden-shimmer', 'بلاشر "ذهبي لامع"', 'Golden Shimmer Blusher',
   'لمسة لامعة ذهبية لإطلالة سهرة فاخرة.', 'A shimmering golden finish for a luxe evening look.',
   105.00, null, (select id from public.categories where slug='blusher'), 17, false, true, false, true),
  ('ATH-BLS-004', 'blusher-berry-flush', 'بلاشر "توتي منعش"', 'Berry Flush Blusher',
   'لون توتي زاهي بقوام قابل للمزج بسهولة.', 'A vivid berry shade with an easily blendable texture.',
   92.00, null, (select id from public.categories where slug='blusher'), 19, false, false, false, true),
  ('ATH-BLS-005', 'blusher-coral-veil', 'بلاشر "مرجاني ناعم"', 'Coral Veil Blusher',
   'لون مرجاني هادئ لإطلالة نهارية طبيعية.', 'A soft coral shade for a natural, everyday finish.',
   88.00, null, (select id from public.categories where slug='blusher'), 25, false, false, false, true)
on conflict (sku) do nothing;

-- ---- Handmade Chains (سلاسل يدوية) -----------------------------------------------
insert into public.products
  (sku, slug, name_ar, name_en, description_ar, description_en, price, discount_price, category_id, stock_quantity, is_featured, is_new_arrival, is_bestseller, is_available)
values
  ('ATH-CHN-001', 'chain-athar-luxury', 'سلسلة "أثر الفخامة"', 'Athar Luxury Chain',
   'سلسلة يدوية مطلية بالذهب بتصميم بسيط وأنيق.', 'A gold-plated handmade chain with a clean, elegant silhouette.',
   260.00, null, (select id from public.categories where slug='handmade-chains'), 14, true, false, true, true),
  ('ATH-CHN-002', 'chain-handmade-pearl', 'سلسلة "اللؤلؤة اليدوية"', 'Handmade Pearl Chain',
   'سلسلة مزينة بلآلئ يدوية الصنع، قطعة فريدة لا تتكرر.', 'Adorned with handcrafted pearls — a truly one-of-a-kind piece.',
   240.00, 210.00, (select id from public.categories where slug='handmade-chains'), 11, false, true, false, true),
  ('ATH-CHN-003', 'chain-golden-elegance', 'سلسلة "الأناقة الذهبية"', 'Golden Elegance Chain',
   'تصميم متعدد الطبقات بلمسة ذهبية فاخرة.', 'A layered design finished in luxurious gold tones.',
   290.00, null, (select id from public.categories where slug='handmade-chains'), 8, false, false, false, true),
  ('ATH-CHN-004', 'chain-desert-trace', 'سلسلة "أثر الصحراء"', 'Desert Trace Chain',
   'سلسلة بتصميم مستوحى من رمال الصحراء الذهبية.', 'A chain design inspired by the golden dunes of the desert.',
   255.00, null, (select id from public.categories where slug='handmade-chains'), 6, true, false, false, true),
  ('ATH-CHN-005', 'chain-royal-knot', 'سلسلة "العقدة الملكية"', 'Royal Knot Chain',
   'عقدة يدوية مركزية تمنح السلسلة طابعاً ملكياً مميزاً.', 'A handcrafted central knot that gives the chain a distinctly regal character.',
   275.00, null, (select id from public.categories where slug='handmade-chains'), 10, false, false, false, true)
on conflict (sku) do nothing;

-- ---- product_images: one placeholder image per seed product ---------------------
insert into public.product_images (product_id, image_url, sort_order)
select p.id,
  case c.slug
    when 'handles'         then 'assets/img/products/handles-placeholder.svg'
    when 'body-splash'     then 'assets/img/products/body-splash-placeholder.svg'
    when 'blusher'         then 'assets/img/products/blusher-placeholder.svg'
    when 'handmade-chains' then 'assets/img/products/handmade-chains-placeholder.svg'
  end,
  0
from public.products p
join public.categories c on c.id = p.category_id
where p.sku like 'ATH-%'
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);
