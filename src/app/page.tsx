import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductSection } from "@/components/home/product-section";
import { WhyDodana } from "@/components/home/why-dodana";
import { InstagramSection } from "@/components/home/instagram-section";
import { getNewArrivals, getBestSellers, getFeaturedProducts } from "@/lib/queries";

export default async function HomePage() {
  const t = await getTranslations("sections");
  const [newArrivals, bestSellers, featured] = await Promise.all([
    getNewArrivals(8),
    getBestSellers(8),
    getFeaturedProducts(4),
  ]);

  return (
    <>
      <Hero />
      <CategoryGrid />
      <ProductSection
        title={t("newDrop")}
        subtitle={t("newDropSubtitle")}
        products={newArrivals.slice(0, 4)}
        viewAllHref="/new-arrivals"
        tone="blush"
      />
      <ProductSection title={t("newArrivals")} products={newArrivals} viewAllHref="/new-arrivals" />
      <ProductSection
        title={t("bestSellers")}
        products={bestSellers}
        viewAllHref="/best-sellers"
        tone="blush"
      />
      <ProductSection title={t("featured")} products={featured} />
      <WhyDodana />
      <InstagramSection />
    </>
  );
}
