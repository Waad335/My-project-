import type { ShopifyProduct } from "@/types/shopify";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: ShopifyProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <p className="font-serif-display text-2xl">No products found</p>
        <p className="text-sm text-muted">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < 3} />
      ))}
    </div>
  );
}
