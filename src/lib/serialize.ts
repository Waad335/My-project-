import { Prisma } from "@prisma/client";
import { toNumber } from "@/lib/utils";

const productWithRelations = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: { images: true, category: true, subcategory: true, variants: true, reviews: true },
});
export type ProductWithRelations = Prisma.ProductGetPayload<typeof productWithRelations>;

export type ProductCardData = {
  id: string;
  slug: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  price: number;
  oldPrice: number | null;
  salePrice: number | null;
  effectivePrice: number;
  image: string | null;
  imageAltEn: string | null;
  imageAltAr: string | null;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  availability: string;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameAr: string;
};

export function serializeProductCard(product: ProductWithRelations): ProductCardData {
  const price = toNumber(product.price);
  const salePrice = product.salePrice ? toNumber(product.salePrice) : null;
  const cover = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    nameEn: product.nameEn,
    nameAr: product.nameAr,
    price,
    oldPrice: product.oldPrice ? toNumber(product.oldPrice) : null,
    salePrice,
    effectivePrice: salePrice ?? price,
    image: cover?.url ?? null,
    imageAltEn: cover?.altEn ?? null,
    imageAltAr: cover?.altAr ?? null,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    isFeatured: product.isFeatured,
    availability: product.availability,
    stock: product.stock,
    ratingAvg: toNumber(product.ratingAvg),
    ratingCount: product.ratingCount,
    categorySlug: product.category?.slug ?? "",
    categoryNameEn: product.category?.nameEn ?? "",
    categoryNameAr: product.category?.nameAr ?? "",
  };
}

export type ProductDetailData = ProductCardData & {
  descriptionEn: string;
  descriptionAr: string;
  ingredientsEn: string | null;
  ingredientsAr: string | null;
  warningsEn: string | null;
  warningsAr: string | null;
  images: { url: string; altEn: string | null; altAr: string | null }[];
  variants: {
    id: string;
    sku: string;
    color: string | null;
    colorHex: string | null;
    size: string | null;
    priceDelta: number;
    stock: number;
    isDefault: boolean;
  }[];
  reviews: {
    id: string;
    authorName: string;
    rating: number;
    comment: string;
    isDemo: boolean;
    createdAt: string;
  }[];
};

export function serializeProductDetail(product: ProductWithRelations): ProductDetailData {
  const base = serializeProductCard(product);
  return {
    ...base,
    descriptionEn: product.descriptionEn,
    descriptionAr: product.descriptionAr,
    ingredientsEn: product.ingredientsEn,
    ingredientsAr: product.ingredientsAr,
    warningsEn: product.warningsEn,
    warningsAr: product.warningsAr,
    images: [...product.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({ url: img.url, altEn: img.altEn, altAr: img.altAr })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      color: v.color,
      colorHex: v.colorHex,
      size: v.size,
      priceDelta: toNumber(v.priceDelta),
      stock: v.stock,
      isDefault: v.isDefault,
    })),
    reviews: product.reviews
      .filter((r) => r.isApproved)
      .map((r) => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        comment: r.comment,
        isDemo: r.isDemo,
        createdAt: r.createdAt.toISOString(),
      })),
  };
}
