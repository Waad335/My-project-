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
