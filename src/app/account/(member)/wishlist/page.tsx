import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { serializeProductCard } from "@/lib/serialize";
import { WishlistGrid } from "@/components/account/wishlist-grid";

export const metadata: Metadata = { title: "My wishlist" };

export default async function AccountWishlistPage() {
  const customer = await requireCustomer("/account/wishlist");
  const rows = await prisma.wishlistItem.findMany({
    where: { userId: customer.id, product: { isActive: true } },
    orderBy: { createdAt: "desc" },
    include: { product: { include: { images: true, category: true, subcategory: true, variants: true, reviews: true } } },
  });
  const products = rows.map((r) => serializeProductCard(r.product));
  return <WishlistGrid products={products} />;
}
