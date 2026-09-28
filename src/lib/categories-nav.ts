// Top-level storefront navigation category slugs, in display order. The
// display names themselves come from the database (Category.nameEn/nameAr)
// via getNavCategories() — this file only pins which categories appear in
// the main nav and in what order.
export const NAV_CATEGORY_SLUGS = ["women", "kids", "curve-plus-size", "home", "beauty"] as const;

// "Shop by category" additions: departments shown after the active shop
// categories in the homepage "Shop by Category" grid and the Categories
// menu's "Shop by category" list, in this order. They aren't marked active
// (that would also add them to the footer and new-arrivals tabs), so their
// card photo is pinned here; a photo set on the category in the database
// still takes precedence.
export const SHOP_EXTRA_CATEGORIES = [
  { slug: "women", image: "/categories/women.jpg" },
  { slug: "kids", image: "/categories/kids.jpg" },
  { slug: "home", image: "/categories/home.jpg" },
  { slug: "beauty", image: "/categories/beauty.jpg" },
] as const;

// Nav label override: the navbar already has a static "Home" link to the
// homepage, so the Home category (decor/Wall Art) uses a distinct label in
// the nav and in the "Shop by category" cards to avoid two "Home" links.
// The category's actual name stays "Home" everywhere else (DB, URL
// /category/home, admin) — reuses the exact wording of its own "Home &
// Living" subcategory.
export const NAV_LABEL_OVERRIDE: Record<string, { en: string; ar: string }> = {
  home: { en: "Home & Living", ar: "المنزل والمعيشة" },
};

export function navCategoryLabel(cat: { slug: string; nameEn: string; nameAr: string }, locale: string): string {
  const override = NAV_LABEL_OVERRIDE[cat.slug];
  if (override) return locale === "ar" ? override.ar : override.en;
  return locale === "ar" ? cat.nameAr : cat.nameEn;
}
