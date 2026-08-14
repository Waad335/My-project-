import { getProductRecommendations } from "@/lib/shopify";
import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Server Component, rendered inside a <Suspense> boundary on the product page
 * so the primary content (gallery, price, add-to-cart) can paint immediately
 * while this — a lower-priority, non-blocking Shopify recommendations query —
 * streams in behind its own skeleton fallback. Owns its own heading so it can
 * disappear as a whole (heading included) on the rare empty-result case,
 * matching the section's previous all-or-nothing behavior.
 */
export async function ProductRecommendations({ productId }: { productId: string }) {
  const recommendations = await getProductRecommendations(productId);
  if (recommendations.length === 0) return null;

  return (
    <section className="mt-28">
      <Reveal>
        <h2 className="font-serif-display mb-10 text-3xl">You May Also Like</h2>
      </Reveal>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {recommendations.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
