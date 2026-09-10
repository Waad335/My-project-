import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductSection } from "@/components/home/product-section";
import { ComingSoonSection } from "@/components/home/coming-soon-section";
import { WhyDodana } from "@/components/home/why-dodana";
import { InstagramSection } from "@/components/home/instagram-section";
import { WhatsAppCta } from "@/components/home/whatsapp-cta";
import { getNewArrivals, getBestSellers, getLatestProducts } from "@/lib/queries";
import type { ProductCardData } from "@/lib/serialize";

export default async function HomePage() {
  const t = await getTranslations("sections");
  const [newArrivals, bestSellers] = await Promise.all([getNewArrivals(8), getBestSellers(8)]);

  let newDropProducts = newArrivals.slice(0, 4);
  let bestSellerProducts = bestSellers;

  // Neither list is flag-driven data the caller should fabricate — when one
  // (or both) come back empty, fall back to the most recent active products
  // instead of hiding the section, so the homepage never looks broken while
  // the catalog is still being built out.
  if (newDropProducts.length === 0 || bestSellerProducts.length === 0) {
    const fallbackPool = await getLatestProducts(12);
    const byId = (a: ProductCardData, b: ProductCardData) => a.id === b.id;

    if (newDropProducts.length === 0 && bestSellerProducts.length === 0) {
      newDropProducts = fallbackPool.slice(0, 4);
      bestSellerProducts = fallbackPool.slice(4, 12);
    } else if (newDropProducts.length === 0) {
      newDropProducts = fallbackPool.filter((p) => !bestSellerProducts.some((b) => byId(p, b))).slice(0, 4);
    } else if (bestSellerProducts.length === 0) {
      bestSellerProducts = fallbackPool.filter((p) => !newDropProducts.some((n) => byId(p, n)));
    }
  }

  const catalogIsEmpty = newDropProducts.length === 0 && bestSellerProducts.length === 0;

  return (
    <>
      <Hero />
      <CategoryGrid />
      {catalogIsEmpty ? (
        <ComingSoonSection />
      ) : (
        <>
          <ProductSection
            title={t("newDrop")}
            subtitle={t("newDropSubtitle")}
            products={newDropProducts}
            viewAllHref="/new-arrivals"
            tone="blush"
          />
          <ProductSection title={t("bestSellers")} products={bestSellerProducts} viewAllHref="/best-sellers" />
        </>
      )}
      <WhyDodana />
      <InstagramSection />
      <WhatsAppCta />
    </>
  );
}
