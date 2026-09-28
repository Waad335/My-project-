import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

// Server-side copies of a signed-in customer's cart and wishlist, rebuilt
// from live product data (current names, images and prices) every time
// they're read. Inactive or deleted products are dropped. Used by the
// website (/api/account/*) and the mobile API (/api/mobile/v1/me/*).

// What a client sends when it saves its cart / wishlist.
export const savedCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        variantId: z.string().min(1).max(64).nullable(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .max(100),
});
export const savedWishlistSchema = z.object({ productIds: z.array(z.string().min(1).max(64)).max(200) });

// Replaces the customer's saved cart with the client's current cart. Only
// keeps lines that point at real products / variants; returns how many.
export async function replaceSavedCart(userId: string, items: z.infer<typeof savedCartSchema>["items"]): Promise<number> {
  const productIds = Array.from(new Set(items.map((i) => i.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, variants: { select: { id: true } } },
  });
  const valid = new Map(products.map((p) => [p.id, new Set(p.variants.map((v) => v.id))]));
  const seen = new Set<string>();
  const rows = items.filter((i) => {
    const variants = valid.get(i.productId);
    if (!variants || (i.variantId && !variants.has(i.variantId))) return false;
    const key = `${i.productId}:${i.variantId ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { userId } }),
    prisma.cartItem.createMany({
      data: rows.map((i) => ({ userId, productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
    }),
  ]);
  return rows.length;
}

// Replaces the customer's saved wishlist; unknown product ids are dropped.
export async function replaceSavedWishlist(userId: string, productIds: string[]): Promise<number> {
  const ids = Array.from(new Set(productIds));
  const existing = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const validIds = ids.filter((id) => existing.some((p) => p.id === id));

  await prisma.$transaction([
    prisma.wishlistItem.deleteMany({ where: { userId } }),
    prisma.wishlistItem.createMany({ data: validIds.map((productId) => ({ userId, productId })) }),
  ]);
  return validIds.length;
}

export type SyncedCartItem = {
  productId: string;
  variantId: string | null;
  slug: string;
  nameEn: string;
  nameAr: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  variantLabel: string | null;
  maxStock: number;
};

export type SyncedWishlistItem = {
  productId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  image: string | null;
  price: number;
};

const productSelect = {
  id: true,
  slug: true,
  nameEn: true,
  nameAr: true,
  price: true,
  salePrice: true,
  stock: true,
  trackStock: true,
  isActive: true,
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
  variants: { select: { id: true, color: true, size: true, priceDelta: true, stock: true } },
};

export async function readAccountState(userId: string): Promise<{ cart: SyncedCartItem[]; wishlist: SyncedWishlistItem[] }> {
  const [cartRows, wishlistRows] = await Promise.all([
    prisma.cartItem.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { product: { select: productSelect } },
    }),
    prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { product: { select: productSelect } },
    }),
  ]);

  const cart: SyncedCartItem[] = [];
  for (const row of cartRows) {
    const p = row.product;
    if (!p.isActive) continue;
    const variant = row.variantId ? p.variants.find((v) => v.id === row.variantId) : null;
    if (row.variantId && !variant) continue;
    const base = toNumber(p.salePrice ?? p.price);
    const maxStock = variant ? variant.stock : p.trackStock ? p.stock : 99;
    if (maxStock <= 0) continue;
    cart.push({
      productId: p.id,
      variantId: variant?.id ?? null,
      slug: p.slug,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      image: p.images[0]?.url ?? null,
      unitPrice: base + (variant ? toNumber(variant.priceDelta) : 0),
      quantity: Math.min(row.quantity, maxStock),
      variantLabel: variant ? [variant.color, variant.size].filter(Boolean).join(" / ") || null : null,
      maxStock,
    });
  }

  const wishlist: SyncedWishlistItem[] = wishlistRows
    .filter((row) => row.product.isActive)
    .map((row) => ({
      productId: row.product.id,
      slug: row.product.slug,
      nameEn: row.product.nameEn,
      nameAr: row.product.nameAr,
      image: row.product.images[0]?.url ?? null,
      price: toNumber(row.product.salePrice ?? row.product.price),
    }));

  return { cart, wishlist };
}
