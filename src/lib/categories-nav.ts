// Top-level storefront navigation category slugs, in display order. The
// display names themselves come from the database (Category.nameEn/nameAr)
// via getNavCategories() — this file only pins which categories appear in
// the main nav and in what order.
export const NAV_CATEGORY_SLUGS = ["women", "kids", "curve-plus-size", "home", "beauty"] as const;

// Nav-only label override: the navbar already has a static "Home" link to
// the homepage, so the Home category (decor/Wall Art) uses a distinct label
// here to avoid two adjacent "Home" links. The category's actual name stays
// "Home" everywhere else (DB, URL /category/home, admin, homepage grid) —
// reuses the exact wording of its own "Home & Living" subcategory.
export const NAV_LABEL_OVERRIDE: Record<string, { en: string; ar: string }> = {
  home: { en: "Home & Living", ar: "المنزل والمعيشة" },
};
