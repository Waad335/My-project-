// One-off, idempotent seed for the SHEIN-inspired category taxonomy
// (Women / Kids / Curve & Plus Size / Home / Beauty / Accessories).
//
// Purely additive: never touches the 5 existing categories (Skincare,
// Haircare, Perfumes, Accessories, Bags) or their products/subcategories.
// Every new category is created with isActive:false so it stays out of the
// homepage "Shop by Category" grid (which renders all isActive categories)
// until explicitly activated later from Admin -> Categories.
//
// Safe to re-run: any category whose slug already exists is skipped
// entirely (not updated), so it never creates duplicates.
//
// Run with:  npx tsx prisma/seed-category-taxonomy.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SubcategorySeed = { slug: string; nameEn: string; nameAr: string };
type CategorySeed = {
  slug: string;
  nameEn: string;
  nameAr: string;
  emoji: string;
  sortOrder: number;
  subcategories: SubcategorySeed[];
};

const CATEGORIES: CategorySeed[] = [
  {
    slug: "women",
    nameEn: "Women",
    nameAr: "نسائي",
    emoji: "👗",
    sortOrder: 6,
    subcategories: [
      { slug: "clothing", nameEn: "Clothing", nameAr: "ملابس" },
      { slug: "dresses", nameEn: "Dresses", nameAr: "فساتين" },
      { slug: "tops", nameEn: "Tops", nameAr: "بلايز" },
      { slug: "t-shirts", nameEn: "T-Shirts", nameAr: "تيشيرتات" },
      { slug: "blouses-shirts", nameEn: "Blouses & Shirts", nameAr: "بلايز وقمصان" },
      { slug: "sweaters-sweatshirts", nameEn: "Sweaters & Sweatshirts", nameAr: "سويترات وسويت شيرت" },
      { slug: "pants", nameEn: "Pants", nameAr: "بناطيل" },
      { slug: "jeans", nameEn: "Jeans", nameAr: "جينز" },
      { slug: "skirts", nameEn: "Skirts", nameAr: "جيبان" },
      { slug: "jumpsuits-co-ords", nameEn: "Jumpsuits & Co-ords", nameAr: "أوفرول وأطقم كو أورد" },
      { slug: "two-piece-outfits", nameEn: "Two-Piece Outfits", nameAr: "أطقم قطعتين" },
      { slug: "outerwear", nameEn: "Outerwear", nameAr: "ملابس خارجية" },
      { slug: "jackets", nameEn: "Jackets", nameAr: "چاكيتات" },
      { slug: "coats", nameEn: "Coats", nameAr: "معاطف" },
      { slug: "cardigans", nameEn: "Cardigans", nameAr: "كارديجان" },
      { slug: "leggings", nameEn: "Leggings", nameAr: "ليجنز" },
      { slug: "suits-suit-sets", nameEn: "Suits & Suit Sets", nameAr: "بدل وأطقم رسمية" },
      { slug: "sportswear", nameEn: "Sportswear", nameAr: "ملابس رياضية" },
      { slug: "beachwear", nameEn: "Beachwear", nameAr: "ملابس شاطئ" },
      { slug: "wedding-event-wear", nameEn: "Wedding & Event Wear", nameAr: "فساتين أفراح ومناسبات" },
      { slug: "maternity-clothing", nameEn: "Maternity Clothing", nameAr: "ملابس حوامل" },
      { slug: "underwear-sleepwear", nameEn: "Underwear & Sleepwear", nameAr: "ملابس داخلية ونوم" },
      { slug: "accessories", nameEn: "Accessories", nameAr: "إكسسوارات" },
    ],
  },
  {
    slug: "kids",
    nameEn: "Kids",
    nameAr: "أطفال",
    emoji: "🧸",
    sortOrder: 7,
    subcategories: [
      { slug: "baby-girls-0-3y", nameEn: "Baby Girls 0–3Y", nameAr: "بيبي بنات 0-3 سنوات" },
      { slug: "baby-boys-0-3y", nameEn: "Baby Boys 0–3Y", nameAr: "بيبي أولاد 0-3 سنوات" },
      { slug: "young-girls-4-7y", nameEn: "Young Girls 4–7Y", nameAr: "بنات صغار 4-7 سنوات" },
      { slug: "young-boys-4-7y", nameEn: "Young Boys 4–7Y", nameAr: "أولاد صغار 4-7 سنوات" },
      { slug: "tween-girls-8-12y", nameEn: "Tween Girls 8–12Y", nameAr: "بنات 8-12 سنة" },
      { slug: "tween-boys-8-12y", nameEn: "Tween Boys 8–12Y", nameAr: "أولاد 8-12 سنة" },
      { slug: "teen-girls-13-16y", nameEn: "Teen Girls 13–16Y", nameAr: "بنات مراهقات 13-16 سنة" },
      { slug: "teen-boys-13-16y", nameEn: "Teen Boys 13–16Y", nameAr: "أولاد مراهقين 13-16 سنة" },
      { slug: "kids-clothing", nameEn: "Kids Clothing", nameAr: "ملابس أطفال" },
      { slug: "kids-dresses", nameEn: "Kids Dresses", nameAr: "فساتين أطفال" },
      { slug: "kids-tops", nameEn: "Kids Tops", nameAr: "بلايز أطفال" },
      { slug: "kids-t-shirts", nameEn: "Kids T-Shirts", nameAr: "تيشيرتات أطفال" },
      { slug: "kids-pants", nameEn: "Kids Pants", nameAr: "بناطيل أطفال" },
      { slug: "kids-jeans", nameEn: "Kids Jeans", nameAr: "جينز أطفال" },
      { slug: "kids-sets-co-ords", nameEn: "Kids Sets & Co-ords", nameAr: "أطقم أطفال" },
      { slug: "baby-clothing", nameEn: "Baby Clothing", nameAr: "ملابس بيبي" },
      { slug: "baby-sets", nameEn: "Baby Sets", nameAr: "أطقم بيبي" },
      { slug: "baby-rompers-jumpsuits", nameEn: "Baby Rompers & Jumpsuits", nameAr: "رومبير وأوفرول بيبي" },
      { slug: "baby-mom-supplies", nameEn: "Baby & Mom Supplies", nameAr: "مستلزمات الأم والطفل" },
      { slug: "kids-shoes", nameEn: "Kids Shoes", nameAr: "أحذية أطفال" },
      { slug: "kids-accessories", nameEn: "Kids Accessories", nameAr: "إكسسوارات أطفال" },
      { slug: "kids-bags", nameEn: "Kids Bags", nameAr: "شنط أطفال" },
      { slug: "kids-jewelry", nameEn: "Kids Jewelry", nameAr: "مجوهرات أطفال" },
      { slug: "toys-games", nameEn: "Toys & Games", nameAr: "ألعاب" },
    ],
  },
  {
    slug: "curve-plus-size",
    nameEn: "Curve / Plus Size",
    nameAr: "مقاسات كبيرة",
    emoji: "💫",
    sortOrder: 8,
    subcategories: [
      { slug: "plus-size-clothing", nameEn: "Plus Size Clothing", nameAr: "ملابس مقاسات كبيرة" },
      { slug: "plus-size-tops", nameEn: "Plus Size Tops", nameAr: "بلايز مقاسات كبيرة" },
      { slug: "plus-size-t-shirts", nameEn: "Plus Size T-Shirts", nameAr: "تيشيرتات مقاسات كبيرة" },
      { slug: "plus-size-blouses", nameEn: "Plus Size Blouses", nameAr: "بلايز وقمصان مقاسات كبيرة" },
      { slug: "plus-size-dresses", nameEn: "Plus Size Dresses", nameAr: "فساتين مقاسات كبيرة" },
      { slug: "plus-size-pants", nameEn: "Plus Size Pants", nameAr: "بناطيل مقاسات كبيرة" },
      { slug: "plus-size-jeans", nameEn: "Plus Size Jeans", nameAr: "جينز مقاسات كبيرة" },
      { slug: "plus-size-skirts", nameEn: "Plus Size Skirts", nameAr: "جيبان مقاسات كبيرة" },
      { slug: "plus-size-leggings", nameEn: "Plus Size Leggings", nameAr: "ليجنز مقاسات كبيرة" },
      { slug: "plus-size-sweaters", nameEn: "Plus Size Sweaters", nameAr: "سويترات مقاسات كبيرة" },
      { slug: "plus-size-jackets", nameEn: "Plus Size Jackets", nameAr: "چاكيتات مقاسات كبيرة" },
      { slug: "plus-size-co-ords", nameEn: "Plus Size Co-ords", nameAr: "أطقم كو أورد مقاسات كبيرة" },
      { slug: "plus-size-suit-sets", nameEn: "Plus Size Suit Sets", nameAr: "أطقم رسمية مقاسات كبيرة" },
      { slug: "plus-size-sportswear", nameEn: "Plus Size Sportswear", nameAr: "ملابس رياضية مقاسات كبيرة" },
      { slug: "plus-size-beachwear", nameEn: "Plus Size Beachwear", nameAr: "ملابس شاطئ مقاسات كبيرة" },
      { slug: "plus-size-underwear-sleepwear", nameEn: "Plus Size Underwear & Sleepwear", nameAr: "ملابس داخلية ونوم مقاسات كبيرة" },
      { slug: "plus-size-accessories", nameEn: "Plus Size Accessories", nameAr: "إكسسوارات مقاسات كبيرة" },
    ],
  },
  {
    slug: "home",
    nameEn: "Home",
    nameAr: "المنزل",
    emoji: "🏠",
    sortOrder: 9,
    subcategories: [
      { slug: "home-living", nameEn: "Home & Living", nameAr: "المنزل والمعيشة" },
      { slug: "home-decor", nameEn: "Home Decor", nameAr: "ديكور المنزل" },
      { slug: "wall-art", nameEn: "Wall Art", nameAr: "لوحات حائط" },
      { slug: "vases", nameEn: "Vases", nameAr: "فازات" },
      { slug: "decorative-crafts", nameEn: "Decorative Crafts", nameAr: "مشغولات ديكورية" },
      { slug: "decorative-objects", nameEn: "Decorative Objects", nameAr: "قطع ديكور" },
      { slug: "decorative-pillows", nameEn: "Decorative Pillows", nameAr: "وسائد ديكور" },
      { slug: "cushion-covers", nameEn: "Cushion Covers", nameAr: "أكياس وسائد" },
      { slug: "curtains", nameEn: "Curtains", nameAr: "ستائر" },
      { slug: "bedroom", nameEn: "Bedroom", nameAr: "غرفة النوم" },
      { slug: "living-room", nameEn: "Living Room", nameAr: "غرفة المعيشة" },
      { slug: "home-textiles", nameEn: "Home Textiles", nameAr: "مفروشات منزلية" },
      { slug: "storage-organization", nameEn: "Storage & Organization", nameAr: "تخزين وتنظيم" },
      { slug: "racks-holders", nameEn: "Racks & Holders", nameAr: "أرفف وحوامل" },
      { slug: "trays", nameEn: "Trays", nameAr: "صواني" },
      { slug: "kitchen-dining", nameEn: "Kitchen & Dining", nameAr: "المطبخ والسفرة" },
      { slug: "dining-sets", nameEn: "Dining Sets", nameAr: "أطقم سفرة" },
      { slug: "kitchen-accessories", nameEn: "Kitchen Accessories", nameAr: "إكسسوارات مطبخ" },
      { slug: "bathroom", nameEn: "Bathroom", nameAr: "الحمام" },
      { slug: "lighting", nameEn: "Lighting", nameAr: "إضاءة" },
      { slug: "night-lights", nameEn: "Night Lights", nameAr: "لايت نايت" },
      { slug: "decorative-hanging-ornaments", nameEn: "Decorative Hanging Ornaments", nameAr: "معلقات ديكور" },
      { slug: "event-party-supplies", nameEn: "Event & Party Supplies", nameAr: "مستلزمات المناسبات والحفلات" },
      { slug: "office-school-supplies", nameEn: "Office & School Supplies", nameAr: "مستلزمات مكتب ومدرسة" },
      { slug: "pet-supplies", nameEn: "Pet Supplies", nameAr: "مستلزمات الحيوانات الأليفة" },
      { slug: "home-toys-games", nameEn: "Toys & Games", nameAr: "ألعاب وتسلية" },
    ],
  },
  {
    slug: "beauty",
    nameEn: "Beauty",
    nameAr: "بيوتي",
    emoji: "💄",
    sortOrder: 10,
    subcategories: [
      { slug: "makeup", nameEn: "Makeup", nameAr: "مكياج" },
      { slug: "blush", nameEn: "Blush", nameAr: "بلاشر" },
      { slug: "eyebrows", nameEn: "Eyebrows", nameAr: "حواجب" },
      { slug: "concealer", nameEn: "Concealer", nameAr: "كونسيلر" },
      { slug: "eyeliner", nameEn: "Eyeliner", nameAr: "آيلاينر" },
      { slug: "foundation", nameEn: "Foundation", nameAr: "فاونديشن" },
      { slug: "lipstick", nameEn: "Lipstick", nameAr: "روج" },
      { slug: "lip-liner", nameEn: "Lip Liner", nameAr: "ليب لاينر" },
      { slug: "lip-sets", nameEn: "Lip Sets", nameAr: "أطقم روج" },
      { slug: "fragrances-aromatherapy", nameEn: "Fragrances & Aromatherapy", nameAr: "عطور وروائح" },
      { slug: "skincare", nameEn: "Skincare", nameAr: "العناية بالبشرة" },
      { slug: "serums-facial-treatments", nameEn: "Serums & Facial Treatments", nameAr: "سيرومات وعلاجات الوجه" },
      { slug: "skin-care-sets", nameEn: "Skin Care Sets", nameAr: "أطقم عناية بالبشرة" },
      { slug: "body-care", nameEn: "Body Care", nameAr: "العناية بالجسم" },
      { slug: "body-creams-lotions", nameEn: "Body Creams & Lotions", nameAr: "كريمات ولوشن الجسم" },
      { slug: "hair-care-styling", nameEn: "Hair Care & Styling", nameAr: "العناية بالشعر وتصفيفه" },
      { slug: "combs-brushes", nameEn: "Combs & Brushes", nameAr: "أمشاط وفرش" },
      { slug: "hair-styling-tools", nameEn: "Hair Styling Tools", nameAr: "أدوات تصفيف الشعر" },
      { slug: "beauty-tools", nameEn: "Beauty Tools", nameAr: "أدوات تجميل" },
      { slug: "nail-hand-foot-care", nameEn: "Nail, Hand & Foot Care", nameAr: "العناية بالأظافر واليدين والقدمين" },
      { slug: "wigs-hair-accessories", nameEn: "Wigs & Hair Accessories", nameAr: "باروكات وإكسسوارات شعر" },
      { slug: "eyelash-lash-products", nameEn: "Eyelash & Lash Products", nameAr: "منتجات الرموش" },
      { slug: "personal-care", nameEn: "Personal Care", nameAr: "العناية الشخصية" },
      { slug: "salon-spa", nameEn: "Salon & Spa", nameAr: "صالون وسبا" },
    ],
  },
  {
    slug: "fashion-accessories",
    nameEn: "Accessories",
    nameAr: "إكسسوارات",
    emoji: "👛",
    sortOrder: 11,
    subcategories: [
      { slug: "bags", nameEn: "Bags", nameAr: "شنط" },
      { slug: "handbags", nameEn: "Handbags", nameAr: "حقائب يد" },
      { slug: "shoulder-bags", nameEn: "Shoulder Bags", nameAr: "شنط كتف" },
      { slug: "crossbody-bags", nameEn: "Crossbody Bags", nameAr: "شنط كروس" },
      { slug: "mini-bags", nameEn: "Mini Bags", nameAr: "شنط ميني" },
      { slug: "jewelry", nameEn: "Jewelry", nameAr: "مجوهرات" },
      { slug: "rings", nameEn: "Rings", nameAr: "خواتم" },
      { slug: "fashion-earrings", nameEn: "Earrings", nameAr: "أقراط" },
      { slug: "fashion-necklaces", nameEn: "Necklaces", nameAr: "قلادات" },
      { slug: "bracelets", nameEn: "Bracelets", nameAr: "أساور" },
      { slug: "jewelry-sets", nameEn: "Jewelry Sets", nameAr: "أطقم مجوهرات" },
      { slug: "watches", nameEn: "Watches", nameAr: "ساعات" },
      { slug: "fashion-hair-accessories", nameEn: "Hair Accessories", nameAr: "إكسسوارات شعر" },
      { slug: "sunglasses", nameEn: "Sunglasses", nameAr: "نظارات شمس" },
      { slug: "wallets-card-holders", nameEn: "Wallets & Card Holders", nameAr: "محافظ وحافظات كروت" },
      { slug: "belts", nameEn: "Belts", nameAr: "أحزمة" },
      { slug: "other-accessories", nameEn: "Other Accessories", nameAr: "إكسسوارات أخرى" },
    ],
  },
];

async function main() {
  console.log("Seeding SHEIN-inspired category taxonomy…");
  let created = 0;
  let skipped = 0;

  for (const cat of CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      console.log(`  skip (already exists): ${cat.slug}`);
      skipped++;
      continue;
    }

    await prisma.category.create({
      data: {
        slug: cat.slug,
        nameEn: cat.nameEn,
        nameAr: cat.nameAr,
        emoji: cat.emoji,
        sortOrder: cat.sortOrder,
        isActive: false,
        subcategories: {
          create: cat.subcategories.map((sub, i) => ({
            slug: sub.slug,
            nameEn: sub.nameEn,
            nameAr: sub.nameAr,
            sortOrder: i,
            isActive: true,
          })),
        },
      },
    });
    console.log(`  created: ${cat.slug} (${cat.subcategories.length} subcategories)`);
    created++;
  }

  console.log(`Done. Categories created: ${created}, skipped (already existed): ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
