"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ShopifyProduct } from "@/types/shopify";
import { ProductMockup } from "@/components/ui/ProductMockup";
import { PriceTag } from "@/components/ui/PriceTag";
import Image from "next/image";
import { DURATION, EASE_LUXURY } from "@/lib/motion";
import { getMockupCategory } from "@/lib/mockup-category";
import { getProductAsset } from "@/lib/product-assets";

export function ProductCard({ product, priority = false }: { product: ShopifyProduct; priority?: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const primaryImage = product.featuredImage ?? product.images[0] ?? null;
  const secondaryImage = product.images.find((img) => img.url !== primaryImage?.url) ?? null;
  const category = product.collections?.[0]?.title ?? product.productType;
  const mockupCategory = getMockupCategory(product);
  const asset = getProductAsset(product.handle);

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-beige">
        {primaryImage ? (
          <>
            <motion.div
              className="absolute inset-0"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
              transition={{ duration: DURATION.base, ease: EASE_LUXURY }}
            >
              <Image
                src={primaryImage.url}
                alt={primaryImage.altText ?? product.title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                priority={priority}
                className="object-cover"
              />
            </motion.div>
            {secondaryImage && (
              <Image
                src={secondaryImage.url}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="absolute inset-0 object-cover opacity-0 transition-opacity duration-base ease-out group-hover:opacity-100"
              />
            )}
          </>
        ) : asset ? (
          <motion.div
            className="absolute inset-0"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
            transition={{ duration: DURATION.base, ease: EASE_LUXURY }}
          >
            <Image
              src={asset.url}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              className="object-cover"
            />
          </motion.div>
        ) : (
          <motion.div
            className="absolute inset-0"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
            transition={{ duration: DURATION.base, ease: EASE_LUXURY }}
          >
            <ProductMockup
              seed={product.handle}
              title={product.title}
              category={mockupCategory}
              className="absolute inset-0"
            />
          </motion.div>
        )}

        {!product.availableForSale && (
          <span className="absolute left-3 top-3 bg-black px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-ivory">
            Sold Out
          </span>
        )}
        {product.tags.includes("new") && product.availableForSale && (
          <span className="absolute left-3 top-3 bg-gold px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-black">
            New
          </span>
        )}

        <span className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 bg-ivory/95 px-4 py-2.5 text-center text-[11px] uppercase tracking-[0.16em] text-black opacity-0 transition-all duration-base ease-out group-hover:translate-y-0 group-hover:opacity-100">
          View Product
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          {category && (
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted">{category}</p>
          )}
          <h3 className="font-serif-display text-lg leading-snug text-black group-hover:text-gold-deep">
            {product.title}
          </h3>
        </div>
        <PriceTag
          amount={product.priceRange.minVariantPrice.amount}
          currencyCode={product.priceRange.minVariantPrice.currencyCode}
          compareAtAmount={product.compareAtPriceRange?.minVariantPrice.amount}
          className="shrink-0 pt-6"
        />
      </div>
    </Link>
  );
}
