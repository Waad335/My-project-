"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ProductCardData } from "@/lib/serialize";
import { ProductCard } from "@/components/product/product-card";
import { useWishlistStore } from "@/store/wishlist-store";

// Server-fetched saved products, filtered live by the wishlist store so an
// un-hearted item leaves the grid immediately.
export function WishlistGrid({ products }: { products: ProductCardData[] }) {
  const t = useTranslations("account");
  const ids = useWishlistStore((s) => s.items.map((i) => i.productId).join(","));
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useWishlistStore.persist.hasHydrated()) setHydrated(true);
    return useWishlistStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const saved = new Set(ids.split(",").filter(Boolean));
  const visible = hydrated ? products.filter((p) => saved.has(p.id)) : products;

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-mocha-700/15 px-6 py-20 text-center">
        <p className="font-heading text-2xl text-mocha-700">{t("noWishlistTitle")}</p>
        <p className="max-w-sm text-sm text-mocha-500">{t("noWishlistBody")}</p>
        <Link href="/shop" className="btn-primary mt-2">
          {t("startShopping")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
      <AnimatePresence initial={false}>
        {visible.map((product) => (
          <motion.li key={product.id} layout exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.35 }}>
            <ProductCard product={product} sizes="(max-width: 768px) 50vw, 25vw" />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
