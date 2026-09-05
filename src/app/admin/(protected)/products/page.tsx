import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEGP, toNumber } from "@/lib/utils";
import { ProductsTable } from "@/components/admin/products-table";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const rows = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    nameEn: p.nameEn,
    categoryName: p.category.nameEn,
    price: toNumber(p.price),
    priceLabel: formatEGP(toNumber(p.salePrice ?? p.price)),
    stock: p.stock,
    availability: p.availability,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    image: p.images[0]?.url ?? null,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-mocha-700">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus size={16} />
          Add Product
        </Link>
      </div>
      <ProductsTable rows={rows} />
    </div>
  );
}
