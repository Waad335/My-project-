import type { ShopifyCollection } from "@/types/shopify";
import { CollectionCard } from "@/components/shop/CollectionCard";
import { Reveal } from "@/components/ui/Reveal";

export function FeaturedCollections({ collections }: { collections: ShopifyCollection[] }) {
  const [first, second, third, fourth, fifth] = collections;

  return (
    <section className="mx-auto max-w-[1600px] px-6 py-24 md:px-10 md:py-32 lg:px-14">
      <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Reveal>
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold">Collections</p>
          <h2 className="font-serif-display max-w-xl text-4xl leading-[1.05] sm:text-5xl">
            Curated for your next chapter.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Five disciplines, one point of view. Every collection is built around the same
            restraint — considered typography, generous space, nothing arbitrary.
          </p>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:grid-rows-2">
        {first && (
          <Reveal className="lg:col-span-4 lg:row-span-2" amount={0.15}>
            <CollectionCard collection={first} size="lg" className="h-full" />
          </Reveal>
        )}
        {second && (
          <Reveal delay={0.1} className="lg:col-span-2" amount={0.15}>
            <CollectionCard collection={second} className="h-full" />
          </Reveal>
        )}
        {third && (
          <Reveal delay={0.2} className="lg:col-span-2" amount={0.15}>
            <CollectionCard collection={third} className="h-full" />
          </Reveal>
        )}
        {fourth && (
          <Reveal delay={0.1} className="sm:col-span-1 lg:col-span-3" amount={0.15}>
            <CollectionCard collection={fourth} className="h-full" />
          </Reveal>
        )}
        {fifth && (
          <Reveal delay={0.2} className="sm:col-span-1 lg:col-span-3" amount={0.15}>
            <CollectionCard collection={fifth} className="h-full" />
          </Reveal>
        )}
      </div>
    </section>
  );
}
