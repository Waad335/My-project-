"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { ShopifyCollection } from "@/types/shopify";
import { ProductMockup } from "@/components/ui/ProductMockup";
import { cn } from "@/lib/utils";
import { DURATION, EASE_LUXURY } from "@/lib/motion";
import { getMockupCategory } from "@/lib/mockup-category";
import { getCollectionAsset } from "@/lib/collection-assets";

export function CollectionCard({
  collection,
  className,
  size = "md",
}: {
  collection: ShopifyCollection;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const prefersReducedMotion = useReducedMotion();
  const aspect = size === "lg" ? "aspect-[4/5] md:aspect-[16/11]" : "aspect-[4/5]";
  const asset = getCollectionAsset(collection.handle);

  return (
    <Link
      href={`/collections/${collection.handle}`}
      className={cn("group relative block overflow-hidden", aspect, className)}
    >
      <motion.div
        className="absolute inset-0"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
        transition={{ duration: DURATION.base, ease: EASE_LUXURY }}
      >
        {collection.image ? (
          <Image
            src={collection.image.url}
            alt={collection.image.altText ?? collection.title}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        ) : asset ? (
          <Image
            src={asset.url}
            alt={collection.title}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        ) : (
          <ProductMockup
            seed={collection.handle}
            title={collection.title}
            category={getMockupCategory({ collections: [{ handle: collection.handle }] })}
            className="absolute inset-0"
          />
        )}
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent transition-opacity duration-base group-hover:from-black/70" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 sm:p-8">
        <h3 className="font-serif-display text-2xl text-ivory sm:text-3xl">{collection.title}</h3>
        <span className="inline-flex w-fit items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ivory/85 transition-all duration-base group-hover:gap-3 group-hover:text-gold">
          Explore
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <path d="M0 5h12.5M8.5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
