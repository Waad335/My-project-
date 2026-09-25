import { getLocale, getTranslations } from "next-intl/server";
import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductRail } from "@/components/home/product-rail";
import { ShowcaseEditorial } from "@/components/home/showcase-editorial";
import { NewArrivalsGrid } from "@/components/home/new-arrivals-grid";
import { ComingSoonSection } from "@/components/home/coming-soon-section";
import { WhyDodana } from "@/components/home/why-dodana";
import { BrandStory } from "@/components/home/brand-story";
import { InstagramSection } from "@/components/home/instagram-section";
import { Newsletter } from "@/components/home/newsletter";
import {
  getActiveCategories,
  getBestSellers,
  getFeaturedProducts,
  getLatestProducts,
  getNewArrivalsByCategory,
  getShowcaseItems,
} from "@/lib/queries";

export default async function HomePage() {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const [categories, showcasePool] = await Promise.all([getActiveCategories(), getShowcaseItems(6)]);
  // The hero shows the first three pieces; the editorial prefers the next
  // ones so the same photos don't repeat back to back.
  const editorialItems = [...showcasePool.slice(3), ...showcasePool.slice(0, 3)].slice(0, 3);

  // Featured is flag-driven; while nothing is flagged yet, fall back to best
  // sellers and then the newest pieces so the showcase never sits empty.
  const [featuredFlagged, newArrivals] = await Promise.all([
    getFeaturedProducts(10),
    getNewArrivalsByCategory(categories.map((c) => c.slug)),
  ]);
  let featured = featuredFlagged;
  if (featured.length < 4) featured = await getBestSellers(10);
  if (featured.length < 4) featured = await getLatestProducts(10);

  const catalogIsEmpty = featured.length === 0 && newArrivals.length === 0;

  return (
    <>
      <Hero />
      <CategoryGrid />

      {catalogIsEmpty ? (
        <ComingSoonSection />
      ) : (
        <section aria-labelledby="featured-title" className="overflow-hidden bg-ivory-50 py-20 lg:py-28">
          <div className="container-dodana">
            <SectionHeading
              id="featured-title"
              eyebrow={t("featuredEyebrow")}
              title={t("featuredTitle")}
              subtitle={t("featuredSubtitle")}
              action={{ href: "/best-sellers", label: t("viewBestSellers") }}
            />
            <ProductRail products={featured} label={t("featuredTitle")} />
          </div>
        </section>
      )}

      {editorialItems.length > 0 && (
        <ShowcaseEditorial
          eyebrow={t("showcaseEyebrow")}
          title={t("showcaseTitle")}
          lines={[t("showcaseLine1"), t("showcaseLine2"), t("showcaseLine3")]}
          cta={{ href: "/shop", label: t("shopEverything") }}
          items={editorialItems}
          locale={locale}
        />
      )}

      {newArrivals.length > 0 && (
        <section aria-labelledby="new-arrivals-title" className="container-dodana py-20 lg:py-28">
          <SectionHeading
            id="new-arrivals-title"
            eyebrow={t("newEyebrow")}
            title={t("newTitle")}
            action={{ href: "/new-arrivals", label: t("viewAllNew") }}
          />
          <NewArrivalsGrid
            products={newArrivals}
            categories={categories.map(({ slug, nameEn, nameAr }) => ({ slug, nameEn, nameAr }))}
          />
        </section>
      )}

      <WhyDodana />
      <BrandStory />
      <InstagramSection />
      <Newsletter />
    </>
  );
}
