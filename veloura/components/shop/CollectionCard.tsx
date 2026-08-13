"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { ShopifyCollection } from "@/types/shopify";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { cn } from "@/lib/utils";

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

  return (
    <Link
      href={`/collections/${collection.handle}`}
      className={cn("group relative block overflow-hidden", aspect, className)}
    >
      <motion.div
        className="absolute inset-0"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {collection.image ? (
          <Image
            src={collection.image.url}
            alt={collection.image.altText ?? collection.title}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        ) : (
          <PlaceholderArt seed={collection.handle} label={collection.title} className="absolute inset-0" />
        )}
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent transition-opacity duration-500 group-hover:from-black/70" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 sm:p-8">
        <h3 className="font-serif-display text-2xl text-ivory sm:text-3xl">{collection.title}</h3>
        <span className="inline-flex w-fit items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ivory/85 transition-all duration-500 group-hover:gap-3 group-hover:text-gold">
          Explore
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <path d="M0 5h12.5M8.5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
