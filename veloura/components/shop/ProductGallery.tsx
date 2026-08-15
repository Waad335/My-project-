"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ProductMockup } from "@/components/ui/ProductMockup";
import type { ShopifyImage } from "@/types/shopify";
import type { MockupCategory } from "@/lib/mockup-category";
import { cn } from "@/lib/utils";
import { DURATION, EASE_LUXURY } from "@/lib/motion";

export function ProductGallery({
  images,
  handle,
  title,
  category,
}: {
  images: ShopifyImage[];
  handle: string;
  title: string;
  category: MockupCategory;
}) {
  const [active, setActive] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const hasImages = images.length > 0;
  const activeImage = images[active];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/5] overflow-hidden bg-beige">
        <AnimatePresence mode="wait">
          {hasImages ? (
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : DURATION.base, ease: EASE_LUXURY }}
              className="absolute inset-0"
            >
              <Image
                src={activeImage.url}
                alt={activeImage.altText ?? title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
                className="object-cover"
              />
            </motion.div>
          ) : (
            <ProductMockup
              key="placeholder"
              seed={handle}
              title={title}
              category={category}
              className="absolute inset-0"
            />
          )}
        </AnimatePresence>
        <span className="absolute left-4 top-4 bg-black/85 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-ivory">
          Instant Digital Download
        </span>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((image, i) => (
            <button
              key={image.url}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={active === i}
              className={cn(
                "relative aspect-square overflow-hidden bg-beige transition-opacity",
                active === i ? "opacity-100 ring-1 ring-gold-deep" : "opacity-60 hover:opacity-90"
              )}
            >
              <Image src={image.url} alt="" fill sizes="10vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
