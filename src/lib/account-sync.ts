import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

// Server-side copies of a signed-in customer's cart and wishlist, rebuilt
// from live product data (current names, images and prices) every time
// they're read. Inactive or deleted products are dropped.

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
