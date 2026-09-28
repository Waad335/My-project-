import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { serializeProductCard, serializeProductDetail } from "@/lib/serialize";
import {
  getBestSellers,
  getFeaturedProducts,
  getLatestProducts,
  getNavCategories,
  getNewArrivalsByCategory,
  getRelatedProducts,
  getShopCategories,
  getShowcaseItems,
} from "@/lib/queries";
import { toDepartment, toProductCard, toProductDetail, toShopCategory, toShowcaseItem } from "@/lib/mobile/dto";
import { PRODUCT_SORTS, type HomeResponse, type ProductListResponse, type ProductResponse } from "@/lib/mobile/types";

// Catalog reads for the mobile API. Built on the website's own queries and
// serializers so the app shows exactly what the website shows; only active
// products are ever returned.

// Same relations as the website's product cards (see src/lib/serialize.ts);
// serializeProductCard's parameter type fails to compile if this drifts.
const productCardInclude = { images: true, category: true, subcategory: true, variants: true, reviews: true } as const;

// The homepage, with the website homepage's fallbacks: "featured" falls
// back to best sellers, then to the newest pieces, when fewer than 4 are
// flagged; new arrivals are the flagged ones first, then the newest.
export async function getHome(): Promise<HomeResponse> {
  const [shopCategories, departments, showcase] = await Promise.all([getShopCategories(), getNavCategories(), getShowcaseItems(6)]);
  const [initialFeatured, newArrivals, bestSellers] = await Promise.all([
    getFeaturedProducts(10),
    getNewArrivalsByCategory(shopCategories.map((c) => c.slug)),
    getBestSellers(10),
  ]);
  let featured = initialFeatured;
  if (featured.length < 4) featured = bestSellers;
  if (featured.length < 4) featured = await getLatestProducts(10);

  return {
    showcase: showcase.map(toShowcaseItem),
    shopCategories: shopCategories.map(toShopCategory),
    departments: departments.map(toDepartment),
    featured: featured.map(toProductCard),
    newArrivals: newArrivals.slice(0, 12).map(toProductCard),
    bestSellers: bestSellers.map(toProductCard),
  };
}

// Empty query values ("?q=&page=") are treated as absent.
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

export const productListQuerySchema = z.object({
  q: optional(z.string().trim().max(80)),
  category: optional(z.string().trim().max(100)),
  sub: optional(z.string().trim().max(100)),
  sort: optional(z.enum(PRODUCT_SORTS)),
  minPrice: optional(z.coerce.number().min(0).max(10_000_000)),
  maxPrice: optional(z.coerce.number().min(0).max(10_000_000)),
  page: optional(z.coerce.number().int().min(1).max(10_000)),
  pageSize: optional(z.coerce.number().int().min(1).max(48)),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

// One listing for the Shop tab, category screens and search: the website's
// /shop search (name, SKU, category name) combined with its category-page
// filters (subcategory, price range on the list price). Pages past the end
// are empty rather than clamped, so infinite scroll never repeats items.
export async function listProducts(query: ProductListQuery): Promise<ProductListResponse> {
  const pageSize = query.pageSize ?? 24;
  const page = query.page ?? 1;
  const q = query.q;
  const where = {
    isActive: true,
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.sub ? { subcategory: { slug: query.sub } } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? {
          price: {
            ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { nameEn: { contains: q, mode: "insensitive" as const } },
            { nameAr: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
            { category: { nameEn: { contains: q, mode: "insensitive" as const } } },
            { category: { nameAr: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const sort = query.sort ?? "featured";
  const orderBy =
    sort === "price-asc"
      ? [{ price: "asc" as const }]
      : sort === "price-desc"
        ? [{ price: "desc" as const }]
        : sort === "newest"
          ? [{ createdAt: "desc" as const }]
          : sort === "rating"
            ? [{ ratingAvg: "desc" as const }, { createdAt: "desc" as const }]
            : [{ isFeatured: "desc" as const }, { isBestSeller: "desc" as const }, { createdAt: "desc" as const }];

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy: [...orderBy, { id: "asc" as const }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return {
    products: products.map((p) => toProductCard(serializeProductCard(p))),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// An active product with up to 4 related pieces from the same category (as
// on the website's product page). Inactive products are "not found" in the
// app — they can't be bought.
export async function getActiveProduct(slug: string): Promise<ProductResponse | null> {
  const product = await prisma.product.findFirst({ where: { slug, isActive: true }, include: productCardInclude });
  if (!product) return null;
  const related = await getRelatedProducts(product.categoryId, product.id, 4);
  return { product: toProductDetail(serializeProductDetail(product)), related: related.map(toProductCard) };
}
