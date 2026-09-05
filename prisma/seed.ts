import { PrismaClient, AvailabilityStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const GOVERNORATES: { en: string; ar: string; fee: number; cairo?: boolean; remote?: boolean }[] = [
  { en: "Cairo", ar: "القاهرة", fee: 60, cairo: true },
  { en: "Giza", ar: "الجيزة", fee: 60, cairo: true },
  { en: "Alexandria", ar: "الإسكندرية", fee: 75 },
  { en: "Qalyubia", ar: "القليوبية", fee: 70 },
  { en: "Dakahlia", ar: "الدقهلية", fee: 75 },
  { en: "Sharqia", ar: "الشرقية", fee: 75 },
  { en: "Gharbia", ar: "الغربية", fee: 75 },
  { en: "Monufia", ar: "المنوفية", fee: 75 },
  { en: "Beheira", ar: "البحيرة", fee: 75 },
  { en: "Kafr El Sheikh", ar: "كفر الشيخ", fee: 80 },
  { en: "Damietta", ar: "دمياط", fee: 80 },
  { en: "Port Said", ar: "بورسعيد", fee: 85 },
  { en: "Ismailia", ar: "الإسماعيلية", fee: 80 },
  { en: "Suez", ar: "السويس", fee: 85 },
  { en: "North Sinai", ar: "شمال سيناء", fee: 120, remote: true },
  { en: "South Sinai", ar: "جنوب سيناء", fee: 120, remote: true },
  { en: "Beni Suef", ar: "بني سويف", fee: 80 },
  { en: "Faiyum", ar: "الفيوم", fee: 80 },
  { en: "Minya", ar: "المنيا", fee: 85 },
  { en: "Assiut", ar: "أسيوط", fee: 90 },
  { en: "Sohag", ar: "سوهاج", fee: 90 },
  { en: "Qena", ar: "قنا", fee: 95 },
  { en: "Luxor", ar: "الأقصر", fee: 95 },
  { en: "Aswan", ar: "أسوان", fee: 100 },
  { en: "Red Sea", ar: "البحر الأحمر", fee: 120, remote: true },
  { en: "New Valley", ar: "الوادي الجديد", fee: 130, remote: true },
  { en: "Matrouh", ar: "مطروح", fee: 100, remote: true },
];

async function main() {
  console.log("Seeding DODANA database…");

  // --- Admin user ---------------------------------------------------------
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@dodana.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "DODANA Admin",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });

  // --- Site settings -------------------------------------------------------
  await prisma.siteSettings.upsert({
    where: { id: "settings" },
    update: {},
    create: {
      id: "settings",
      whatsappNumber: process.env.WHATSAPP_NUMBER || "201000000000",
      whatsappGroupUrl: "https://chat.whatsapp.com/C1S3FiRHR655kXmq3gvjwn",
      instagramUrl: "https://www.instagram.com/dodana.girls/",
      tiktokUrl: "https://tiktok.com/@dodana",
      codEnabled: true,
      onlinePaymentEnabled: false,
      announcementEn: "Good taste, already found. Free returns exceptions apply — see policy.",
      announcementAr: "لقيناها عشانك، قبل ما تدوري 💗",
      returnsPolicyEn: `Because of hygiene, opened skincare, haircare, and perfume products cannot be returned or exchanged once received.

If your item arrives damaged, defective, or incorrect, contact us within 48 hours of delivery with photos of the item and packaging, and we will arrange a replacement or refund as required by applicable consumer protection law.

Unopened, unused items in their original packaging may be considered for return within 3 days of delivery at our discretion — contact us first before sending anything back.`,
      returnsPolicyAr: `لأسباب تتعلق بالنظافة، لا يمكن استرجاع أو استبدال منتجات العناية بالبشرة والشعر والعطور بعد فتحها.

في حال وصول المنتج تالفًا أو معيبًا أو غير مطابق للطلب، يرجى التواصل معنا خلال 48 ساعة من الاستلام مع صور للمنتج والتغليف، وسنقوم بترتيب الاستبدال أو الاسترداد وفقًا للقانون المعمول به.

المنتجات غير المفتوحة وغير المستخدمة وبتغليفها الأصلي قد يُنظر في استرجاعها خلال 3 أيام من الاستلام حسب تقديرنا — يرجى التواصل معنا أولًا قبل إرسال أي منتج.`,
    },
  });

  // --- Shipping zones --------------------------------------------------------
  for (const gov of GOVERNORATES) {
    await prisma.shippingZone.upsert({
      where: { governorate: gov.en },
      update: {},
      create: {
        governorate: gov.en,
        governorateAr: gov.ar,
        fee: gov.fee,
        isCairo: Boolean(gov.cairo),
        etaEn: gov.cairo ? "Fast delivery within Cairo" : "Fast delivery across Egypt",
        etaAr: gov.cairo ? "توصيل سريع داخل القاهرة" : "توصيل سريع لكل مصر",
      },
    });
  }

  // --- Promo codes -------------------------------------------------------
  await prisma.promoCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      minOrderValue: 300,
      maxDiscount: 150,
      isActive: true,
    },
  });

  // --- Categories ----------------------------------------------------------
  const categoriesData = [
    { slug: "skincare", nameEn: "Skincare", nameAr: "العناية بالبشرة", emoji: "🧴", image: "/placeholders/skincare.svg", sortOrder: 1, subs: [
      { slug: "cleansers", nameEn: "Cleansers", nameAr: "غسول الوجه" },
      { slug: "moisturizers", nameEn: "Moisturizers", nameAr: "مرطبات" },
      { slug: "serums", nameEn: "Serums", nameAr: "سيرومات" },
    ] },
    { slug: "haircare", nameEn: "Haircare", nameAr: "العناية بالشعر", emoji: "🫧", image: "/placeholders/haircare.svg", sortOrder: 2, subs: [
      { slug: "shampoo", nameEn: "Shampoo & Conditioner", nameAr: "شامبو وبلسم" },
      { slug: "hair-oils", nameEn: "Hair Oils", nameAr: "زيوت الشعر" },
      { slug: "styling", nameEn: "Styling", nameAr: "تصفيف الشعر" },
    ] },
    { slug: "perfumes", nameEn: "Perfumes", nameAr: "العطور", emoji: "🌸", image: "/placeholders/perfumes.svg", sortOrder: 3, subs: [
      { slug: "eau-de-parfum", nameEn: "Eau de Parfum", nameAr: "أو دو بارفان" },
      { slug: "body-mist", nameEn: "Body Mist", nameAr: "بودي ميست" },
      { slug: "musk", nameEn: "Musk", nameAr: "مسك" },
    ] },
    { slug: "accessories", nameEn: "Accessories", nameAr: "إكسسوارات", emoji: "💎", image: "/placeholders/accessories.svg", sortOrder: 4, subs: [
      { slug: "necklaces", nameEn: "Necklaces", nameAr: "قلادات" },
      { slug: "earrings", nameEn: "Earrings", nameAr: "أقراط" },
      { slug: "hair-accessories", nameEn: "Hair Accessories", nameAr: "إكسسوارات شعر" },
    ] },
    { slug: "bags", nameEn: "Bags", nameAr: "شنط", emoji: "👜", image: "/placeholders/bags.svg", sortOrder: 5, subs: [
      { slug: "totes", nameEn: "Totes", nameAr: "شنط توتس" },
      { slug: "crossbody", nameEn: "Crossbody Bags", nameAr: "شنط كروس" },
      { slug: "pouches", nameEn: "Pouches", nameAr: "شنط صغيرة" },
    ] },
  ];

  const categoryMap = new Map<string, { id: string; subs: Map<string, string> }>();
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        nameEn: cat.nameEn,
        nameAr: cat.nameAr,
        emoji: cat.emoji,
        image: cat.image,
        sortOrder: cat.sortOrder,
        descriptionEn: `Curated ${cat.nameEn.toLowerCase()} finds — good taste, already found.`,
        descriptionAr: `مختارات ${cat.nameAr} — لقيناها عشانك.`,
      },
    });
    const subMap = new Map<string, string>();
    for (const [i, sub] of cat.subs.entries()) {
      const created = await prisma.subcategory.upsert({
        where: { slug: sub.slug },
        update: {},
        create: {
          slug: sub.slug,
          nameEn: sub.nameEn,
          nameAr: sub.nameAr,
          categoryId: category.id,
          sortOrder: i,
        },
      });
      subMap.set(sub.slug, created.id);
    }
    categoryMap.set(cat.slug, { id: category.id, subs: subMap });
  }

  // --- Products --------------------------------------------------------------
  type SeedProduct = {
    sku: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    categorySlug: string;
    subSlug: string;
    price: number;
    oldPrice?: number;
    descriptionEn: string;
    descriptionAr: string;
    ingredientsEn?: string;
    ingredientsAr?: string;
    stock: number;
    featured?: boolean;
    bestSeller?: boolean;
    newArrival?: boolean;
    image: string;
    variants?: { color?: string; colorHex?: string; size?: string; sku: string; priceDelta?: number; stock: number }[];
  };

  const products: SeedProduct[] = [
    {
      sku: "DOD-SKN-001", slug: "glow-vitamin-c-serum", nameEn: "Glow Vitamin C Serum", nameAr: "سيروم فيتامين سي جلو",
      categorySlug: "skincare", subSlug: "serums", price: 480, oldPrice: 620,
      descriptionEn: "A lightweight brightening serum for a fresh, even-looking glow.",
      descriptionAr: "سيروم خفيف مضيء يمنح بشرتك إشراقة نضرة ومتجانسة.",
      ingredientsEn: "Aqua, Vitamin C (Ascorbic Acid), Hyaluronic Acid, Glycerin, Niacinamide.",
      ingredientsAr: "ماء، فيتامين سي، حمض الهيالورونيك، جليسرين، نياسيناميد.",
      stock: 24, featured: true, bestSeller: true, image: "/placeholders/skincare.svg",
    },
    {
      sku: "DOD-SKN-002", slug: "rose-water-cleanser", nameEn: "Rose Water Gentle Cleanser", nameAr: "غسول ماء الورد اللطيف",
      categorySlug: "skincare", subSlug: "cleansers", price: 260,
      descriptionEn: "A soothing daily cleanser infused with rose water for soft, calm skin.",
      descriptionAr: "غسول يومي مهدئ بماء الورد يترك بشرتك ناعمة وهادئة.",
      stock: 40, newArrival: true, image: "/placeholders/skincare.svg",
    },
    {
      sku: "DOD-SKN-003", slug: "whipped-shea-moisturizer", nameEn: "Whipped Shea Moisturizer", nameAr: "مرطب زبدة الشيا المخفوقة",
      categorySlug: "skincare", subSlug: "moisturizers", price: 340,
      descriptionEn: "A rich, whipped cream that melts into skin for all-day softness.",
      descriptionAr: "كريم غني ومخفوق يذوب في البشرة ليمنحها نعومة طوال اليوم.",
      stock: 18, image: "/placeholders/skincare.svg",
    },
    {
      sku: "DOD-HAI-001", slug: "argan-hair-oil", nameEn: "Argan Repair Hair Oil", nameAr: "زيت الأرجان لإصلاح الشعر",
      categorySlug: "haircare", subSlug: "hair-oils", price: 320, oldPrice: 400,
      descriptionEn: "A nourishing oil blend that helps tame frizz and add shine.",
      descriptionAr: "مزيج زيوت مغذي يساعد على ترويض الشعر المجعد ومنحه لمعانًا.",
      stock: 30, bestSeller: true, image: "/placeholders/haircare.svg",
    },
    {
      sku: "DOD-HAI-002", slug: "silk-shine-shampoo", nameEn: "Silk Shine Shampoo", nameAr: "شامبو الحرير اللامع",
      categorySlug: "haircare", subSlug: "shampoo", price: 290,
      descriptionEn: "A gentle sulfate-conscious shampoo that leaves hair soft and shiny.",
      descriptionAr: "شامبو لطيف يترك الشعر ناعمًا ولامعًا.",
      stock: 26, newArrival: true, image: "/placeholders/haircare.svg",
    },
    {
      sku: "DOD-HAI-003", slug: "curl-defining-cream", nameEn: "Curl Defining Cream", nameAr: "كريم تحديد الكيرلي",
      categorySlug: "haircare", subSlug: "styling", price: 250,
      descriptionEn: "A light styling cream that defines curls without the crunch.",
      descriptionAr: "كريم تصفيف خفيف يحدد الكيرلي دون تيبيس.",
      stock: 15, image: "/placeholders/haircare.svg",
    },
    {
      sku: "DOD-PRF-001", slug: "yara-candy-edp", nameEn: "Yara Candy Eau de Parfum", nameAr: "يارا كاندي أو دو بارفان",
      categorySlug: "perfumes", subSlug: "eau-de-parfum", price: 550, oldPrice: 650,
      descriptionEn: "A sweet, playful gourmand fragrance with vanilla and candy notes.",
      descriptionAr: "عطر حلو ومرح بنفحات الفانيليا والحلوى.",
      stock: 20, featured: true, bestSeller: true, image: "/placeholders/perfumes.svg",
      variants: [
        { size: "20ml", sku: "DOD-PRF-001-20", priceDelta: 0, stock: 12 },
        { size: "50ml", sku: "DOD-PRF-001-50", priceDelta: 220, stock: 8 },
      ],
    },
    {
      sku: "DOD-PRF-002", slug: "blueberry-musk", nameEn: "Blueberry Musk", nameAr: "مسك بلوبيري",
      categorySlug: "perfumes", subSlug: "musk", price: 180,
      descriptionEn: "A fruity musk oil with a soft, long-lasting trail.",
      descriptionAr: "مسك زيتي بنفحة فاكهية وثبات ناعم طويل.",
      stock: 35, newArrival: true, image: "/placeholders/perfumes.svg",
    },
    {
      sku: "DOD-PRF-003", slug: "vanilla-body-mist", nameEn: "Vanilla Cloud Body Mist", nameAr: "بودي ميست فانيليا كلاود",
      categorySlug: "perfumes", subSlug: "body-mist", price: 220,
      descriptionEn: "A soft vanilla mist for a cozy, everyday scent layer.",
      descriptionAr: "رذاذ جسم بنفحة فانيليا ناعمة لإطلالة يومية دافئة.",
      stock: 28, image: "/placeholders/perfumes.svg",
    },
    {
      sku: "DOD-ACC-001", slug: "pearl-drop-necklace", nameEn: "Pearl Drop Necklace", nameAr: "قلادة اللؤلؤة",
      categorySlug: "accessories", subSlug: "necklaces", price: 380,
      descriptionEn: "A delicate gold-tone necklace with a single pearl drop.",
      descriptionAr: "قلادة ذهبية اللون رقيقة بحبة لؤلؤ واحدة.",
      stock: 22, featured: true, image: "/placeholders/accessories.svg",
      variants: [
        { color: "Gold", colorHex: "#C79A5E", sku: "DOD-ACC-001-GLD", stock: 12 },
        { color: "Silver", colorHex: "#C7C7C7", sku: "DOD-ACC-001-SLV", stock: 10 },
      ],
    },
    {
      sku: "DOD-ACC-002", slug: "heart-huggie-earrings", nameEn: "Heart Huggie Earrings", nameAr: "حلق هاجي قلب",
      categorySlug: "accessories", subSlug: "earrings", price: 220,
      descriptionEn: "Tiny heart huggie hoops for everyday sweetness.",
      descriptionAr: "حلقات صغيرة على شكل قلب لإطلالة يومية لطيفة.",
      stock: 30, bestSeller: true, image: "/placeholders/accessories.svg",
    },
    {
      sku: "DOD-ACC-003", slug: "satin-hair-bow-clip", nameEn: "Satin Bow Hair Clip", nameAr: "مشبك شعر فيونكة ساتان",
      categorySlug: "accessories", subSlug: "hair-accessories", price: 140,
      descriptionEn: "A soft satin bow clip in DODANA's signature blush tone.",
      descriptionAr: "مشبك فيونكة ساتان ناعم بلون الوردي المميز لدودانا.",
      stock: 45, newArrival: true, image: "/placeholders/accessories.svg",
      variants: [
        { color: "Blush", colorHex: "#DB9A96", sku: "DOD-ACC-003-BLS", stock: 20 },
        { color: "Ivory", colorHex: "#FBF5EF", sku: "DOD-ACC-003-IVR", stock: 25 },
      ],
    },
    {
      sku: "DOD-BAG-001", slug: "everyday-tote", nameEn: "Everyday Woven Tote", nameAr: "شنطة توتس منسوجة يومية",
      categorySlug: "bags", subSlug: "totes", price: 620, oldPrice: 750,
      descriptionEn: "A spacious woven tote that goes from errands to brunch.",
      descriptionAr: "شنطة توتس منسوجة واسعة تناسب كل مشاويرك.",
      stock: 14, featured: true, bestSeller: true, image: "/placeholders/bags.svg",
    },
    {
      sku: "DOD-BAG-002", slug: "mini-crossbody", nameEn: "Mini Blush Crossbody", nameAr: "شنطة كروس ميني وردية",
      categorySlug: "bags", subSlug: "crossbody", price: 480,
      descriptionEn: "A compact crossbody with a soft gold chain strap.",
      descriptionAr: "شنطة كروس صغيرة بحزام سلسلة ذهبية ناعمة.",
      stock: 16, newArrival: true, image: "/placeholders/bags.svg",
      variants: [
        { color: "Blush", colorHex: "#DB9A96", sku: "DOD-BAG-002-BLS", stock: 8 },
        { color: "Mocha", colorHex: "#3A2620", sku: "DOD-BAG-002-MOC", stock: 8 },
      ],
    },
    {
      sku: "DOD-BAG-003", slug: "silk-makeup-pouch", nameEn: "Silk Touch Makeup Pouch", nameAr: "شنطة مكياج ساتان",
      categorySlug: "bags", subSlug: "pouches", price: 190,
      descriptionEn: "A soft satin pouch to keep your everyday makeup organized.",
      descriptionAr: "شنطة ساتان ناعمة لترتيب أدوات المكياج اليومية.",
      stock: 38, image: "/placeholders/bags.svg",
    },
  ];

  for (const p of products) {
    const category = categoryMap.get(p.categorySlug)!;
    const availability: AvailabilityStatus =
      p.stock === 0 ? "OUT_OF_STOCK" : p.stock < 10 ? "LOW_STOCK" : "IN_STOCK";

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        sku: p.sku,
        slug: p.slug,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        descriptionEn: p.descriptionEn,
        descriptionAr: p.descriptionAr,
        ingredientsEn: p.ingredientsEn,
        ingredientsAr: p.ingredientsAr,
        categoryId: category.id,
        subcategoryId: category.subs.get(p.subSlug),
        price: p.price,
        oldPrice: p.oldPrice,
        stock: p.stock,
        availability,
        isFeatured: Boolean(p.featured),
        isBestSeller: Boolean(p.bestSeller),
        isNewArrival: Boolean(p.newArrival),
        ratingAvg: 4.5,
        ratingCount: 12,
        images: { create: [{ url: p.image, altEn: p.nameEn, altAr: p.nameAr, sortOrder: 0 }] },
        variants: p.variants
          ? {
              create: p.variants.map((v, i) => ({
                sku: v.sku,
                color: v.color,
                colorHex: v.colorHex,
                size: v.size,
                priceDelta: v.priceDelta ?? 0,
                stock: v.stock,
                isDefault: i === 0,
              })),
            }
          : undefined,
        reviews: {
          create: [
            {
              authorName: "Nourhan A.",
              rating: 5,
              comment: "Demo review for preview — replace with real customer reviews once you're live.",
              isDemo: true,
            },
            {
              authorName: "Mariam S.",
              rating: 4,
              comment: "Demo review for preview — packaging looked lovely, exactly as pictured.",
              isDemo: true,
            },
          ],
        },
      },
    });
  }

  console.log(`Seeded ${categoriesData.length} categories and ${products.length} products.`);
  console.log(`Admin login → ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
