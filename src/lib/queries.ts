import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { serializeProductCard, serializeProductDetail, type ProductCardData } from "@/lib/serialize";
import { NAV_CATEGORY_SLUGS } from "@/lib/categories-nav";

const cardInclude = {
  images: true,
  category: true,
  subcategory: true,
  variants: true,
  reviews: true,
} as const;

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: cardInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(serializeProductCard);
}

export async function getBestSellers(limit = 8): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isBestSeller: true },
    include: cardInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(serializeProductCard);
}

export async function getNewArrivals(limit = 8): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isNewArrival: true },
    include: cardInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(serializeProductCard);
}

// Fallback pool for homepage sections when a flag-based list (New Drop,
// Best Sellers) has nothing yet — any active product, newest first, with
// no isFeatured/isBestSeller/isNewArrival requirement.
export async function getLatestProducts(limit = 8): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: cardInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return products.map(serializeProductCard);
}

// Pool for the homepage "New Arrivals" filter tabs: the newest pieces overall
// plus the newest per category, so every tab has something to show even when
// one category dominates recent uploads. Flagged new arrivals come first.
export async function getNewArrivalsByCategory(categorySlugs: string[], perCategory = 8): Promise<ProductCardData[]> {
  const orderBy = [{ isNewArrival: "desc" as const }, { createdAt: "desc" as const }];
  const [overall, ...perCat] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, include: cardInclude, orderBy, take: perCategory }),
    ...categorySlugs.map((slug) =>
      prisma.product.findMany({
        where: { isActive: true, category: { slug } },
        include: cardInclude,
        orderBy,
        take: perCategory,
      })
    ),
  ]);
  const seen = new Set<string>();
  const merged = [...(overall ?? []), ...perCat.flat()].filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  return merged.map(serializeProductCard).sort((a, b) => {
    if (a.isNewArrival !== b.isNewArrival) return a.isNewArrival ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: { subcategories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
}

export type NavCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  subcategories: { id: string; slug: string; nameEn: string; nameAr: string }[];
};

// Backs the main storefront navigation (header dropdowns, mobile accordion,
// footer "Shop" links) — the specific categories/order are pinned by
// NAV_CATEGORY_SLUGS, but names and subcategories always come live from the
// database so admin edits (rename, add/remove a subcategory) show up with no
// code change. Independent of Category.isActive, which only gates the
// homepage "Shop by Category" grid.
//
// Wrapped in React's cache() because both the header and footer call this on
// every page render — without it, that's two extra DB round-trips per
// request instead of one shared/deduplicated call.
export const getNavCategories = cache(async (): Promise<NavCategory[]> => {
  const categories = await prisma.category.findMany({
    where: { slug: { in: [...NAV_CATEGORY_SLUGS] } },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameAr: true,
      subcategories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, slug: true, nameEn: true, nameAr: true },
      },
    },
  });
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  return NAV_CATEGORY_SLUGS.map((slug) => bySlug.get(slug)).filter((c): c is NavCategory => Boolean(c));
});

export type ActiveCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  image: string | null;
  productCount: number;
};

// The storefront's "shop" categories (homepage cards, hero links, shop
// filters, categories menu) — whatever the admin has marked active, in the
// admin's sort order. Cached per request since several sections share it.
export const getActiveCategories = cache(async (): Promise<ActiveCategory[]> => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameAr: true,
      descriptionEn: true,
      descriptionAr: true,
      image: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
  return categories.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
});

// ── Boutique showcase (hero + editorial) ─────────────────────────────────
// Real imagery only: product photos from the catalog, topped up with
// DODANA's own category photography. Never generic/stock or invented items.

export type ShowcaseItem = {
  id: string;
  kind: "product" | "category";
  image: string;
  nameEn: string;
  nameAr: string;
  href: string;
  // A real .glb of this exact product, when one has been uploaded.
  modelUrl: string | null;
};

const SHOWCASE_CATEGORY_ORDER = ["perfumes", "skincare", "bags", "accessories", "haircare"];
const isRealImage = (url: string | null | undefined): url is string => Boolean(url) && !url!.startsWith("/placeholders/");

export const getShowcaseItems = cache(async (count = 3): Promise<ShowcaseItem[]> => {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, images: { some: {} } },
      orderBy: [{ isFeatured: "desc" }, { isBestSeller: "desc" }, { createdAt: "desc" }],
      take: 40,
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        model3dUrl: true,
        category: { select: { slug: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    }),
    getActiveCategories(),
  ]);

  // One product per category first (so the stage mixes perfume, skincare,
  // bags, accessories), then any remaining real product photos.
  const withImages = products.filter((p) => isRealImage(p.images[0]?.url));
  const rank = (slug: string) => {
    const i = SHOWCASE_CATEGORY_ORDER.indexOf(slug);
    return i === -1 ? SHOWCASE_CATEGORY_ORDER.length : i;
  };
  const picked: typeof withImages = [];
  const seenCategories = new Set<string>();
  for (const p of [...withImages].sort((a, b) => rank(a.category.slug) - rank(b.category.slug))) {
    if (picked.length >= count) break;
    if (seenCategories.has(p.category.slug)) continue;
    seenCategories.add(p.category.slug);
    picked.push(p);
  }
  for (const p of withImages) {
    if (picked.length >= count) break;
    if (!picked.includes(p)) picked.push(p);
  }

  const items: ShowcaseItem[] = picked.map((p) => ({
    id: p.id,
    kind: "product",
    image: p.images[0]!.url,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    href: `/product/${p.slug}`,
    modelUrl: p.model3dUrl,
  }));

  const categoryPhotos = categories
    .filter((c) => isRealImage(c.image))
    .sort((a, b) => rank(a.slug) - rank(b.slug));
  for (const c of categoryPhotos) {
    if (items.length >= count) break;
    items.push({
      id: c.id,
      kind: "category",
      image: c.image!,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      href: `/category/${c.slug}`,
      modelUrl: null,
    });
  }
  return items;
});

export type CategoryProductFilters = {
  subcategorySlug?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "rating";
  minPrice?: number;
  maxPrice?: number;
};

export async function getProductsByCategory(categorySlug: string, filters: CategoryProductFilters = {}) {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return { category: null, products: [] as ProductCardData[] };

  const orderBy =
    filters.sort === "price-asc"
      ? { price: "asc" as const }
      : filters.sort === "price-desc"
        ? { price: "desc" as const }
        : filters.sort === "rating"
          ? { ratingAvg: "desc" as const }
          : { createdAt: "desc" as const };

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: category.id,
      ...(filters.subcategorySlug ? { subcategory: { slug: filters.subcategorySlug } } : {}),
      ...(filters.minPrice || filters.maxPrice
        ? {
            price: {
              ...(filters.minPrice ? { gte: filters.minPrice } : {}),
              ...(filters.maxPrice ? { lte: filters.maxPrice } : {}),
            },
          }
        : {}),
    },
    include: cardInclude,
    orderBy,
  });

  return { category, products: products.map(serializeProductCard) };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: cardInclude,
  });
  if (!product) return null;
  return serializeProductDetail(product);
}

export async function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 4) {
  const products = await prisma.product.findMany({
    where: { isActive: true, categoryId, id: { not: excludeProductId } },
    include: cardInclude,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return products.map(serializeProductCard);
}

export const SHOP_SORTS = ["featured", "newest", "price-asc", "price-desc"] as const;
export type ShopSort = (typeof SHOP_SORTS)[number];
export const SHOP_PAGE_SIZE = 24;

// Backs /shop: free-text search + category filter + sort, paginated.
// Sorting by price uses the stored list price; sale prices are rarer and the
// admin keeps `price` as the selling price with `oldPrice` as the strikethrough.
export async function getShopProducts({
  q,
  categorySlug,
  sort = "featured",
  page = 1,
}: {
  q?: string;
  categorySlug?: string;
  sort?: ShopSort;
  page?: number;
}): Promise<{ products: ProductCardData[]; total: number; page: number; pageCount: number }> {
  const query = q?.trim().slice(0, 80);
  const where = {
    isActive: true,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(query
      ? {
          OR: [
            { nameEn: { contains: query, mode: "insensitive" as const } },
            { nameAr: { contains: query, mode: "insensitive" as const } },
            { sku: { contains: query, mode: "insensitive" as const } },
            { category: { nameEn: { contains: query, mode: "insensitive" as const } } },
            { category: { nameAr: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const orderBy =
    sort === "price-asc"
      ? [{ price: "asc" as const }]
      : sort === "price-desc"
        ? [{ price: "desc" as const }]
        : sort === "newest"
          ? [{ createdAt: "desc" as const }]
          : [{ isFeatured: "desc" as const }, { isBestSeller: "desc" as const }, { createdAt: "desc" as const }];

  const total = await prisma.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / SHOP_PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const products = await prisma.product.findMany({
    where,
    include: cardInclude,
    orderBy: [...orderBy, { id: "asc" as const }],
    skip: (current - 1) * SHOP_PAGE_SIZE,
    take: SHOP_PAGE_SIZE,
  });
  return { products: products.map(serializeProductCard), total, page: current, pageCount };
}

// Categories to offer as shop filters: the active storefront categories plus
// any other category that currently has products on sale.
export async function getShopFilterCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      slug: true,
      nameEn: true,
      nameAr: true,
      isActive: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
  return categories
    .filter((c) => c.isActive || c._count.products > 0)
    .map((c) => ({ slug: c.slug, nameEn: c.nameEn, nameAr: c.nameAr, count: c._count.products }));
}

export async function searchProducts(query: string, limit = 24) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { nameEn: { contains: query, mode: "insensitive" } },
        { nameAr: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
      ],
    },
    include: cardInclude,
    take: limit,
  });
  return products.map(serializeProductCard);
}
