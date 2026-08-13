import { getCollections, getProducts } from "@/lib/shopify";
import { Hero } from "@/components/home/Hero";
import { FeaturedCollections } from "@/components/home/FeaturedCollections";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { WorkspaceExperience } from "@/components/home/WorkspaceExperience";
import { Editorial } from "@/components/home/Editorial";
import { WhyVeloura } from "@/components/home/WhyVeloura";
import { Testimonials } from "@/components/home/Testimonials";

export default async function HomePage() {
  const [collections, products] = await Promise.all([
    getCollections(),
    getProducts({ sortKey: "BEST_SELLING" }),
  ]);

  return (
    <>
      <Hero />
      <FeaturedCollections collections={collections} />
      <FeaturedProducts products={products} />
      <WorkspaceExperience />
      <Editorial />
      <WhyVeloura />
      <Testimonials />
    </>
  );
}
