import type { Metadata } from "next";
import { getCollections } from "@/lib/shopify";
import { CollectionCard } from "@/components/shop/CollectionCard";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse VELOURA's curated collections — resume templates, brand kits, digital planners, and more.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-32 md:px-10 lg:px-14 lg:pt-40">
      <Reveal className="mb-14 max-w-2xl">
        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold-deep">Collections</p>
        <h1 className="font-serif-display text-4xl leading-[1.05] sm:text-5xl">
          Every Discipline, One Point of View
        </h1>
      </Reveal>

      <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <StaggerItem key={collection.handle}>
            <CollectionCard collection={collection} size="lg" className="h-full" />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}
