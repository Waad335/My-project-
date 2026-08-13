import type { ShopifyProduct } from "@/types/shopify";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function FeaturedProducts({ products }: { products: ShopifyProduct[] }) {
  return (
    <section className="bg-beige/40 py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10 lg:px-14">
        <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold">Best Sellers</p>
            <h2 className="font-serif-display max-w-xl text-4xl leading-[1.05] sm:text-5xl">
              Considered by design, chosen by many.
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <Button href="/shop" variant="secondary" size="sm">
              View All Products
            </Button>
          </Reveal>
        </div>

        <StaggerGroup className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((product, i) => (
            <StaggerItem key={product.id}>
              <ProductCard product={product} priority={i < 4} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
