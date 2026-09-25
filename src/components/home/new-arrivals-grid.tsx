"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import type { ProductCardData } from "@/lib/serialize";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";

type FilterCategory = { slug: string; nameEn: string; nameAr: string };

const EASE = [0.22, 1, 0.36, 1] as const;
const VISIBLE = 8;

export function NewArrivalsGrid({ products, categories }: { products: ProductCardData[]; categories: FilterCategory[] }) {
  const locale = useLocale();
  const t = useTranslations("home");
  const [active, setActive] = useState<string>("all");
  const tablistId = useId();

  const filtered = useMemo(
    () => (active === "all" ? products : products.filter((p) => p.categorySlug === active)).slice(0, VISIBLE),
    [active, products]
  );
  const activeCategory = categories.find((c) => c.slug === active);
  const tabs = [{ slug: "all", label: t("filterAll") }, ...categories.map((c) => ({ slug: c.slug, label: locale === "ar" ? c.nameAr : c.nameEn }))];

  return (
    <div>
      <LayoutGroup id={tablistId}>
        <div
          role="tablist"
          aria-label={t("filterLabel")}
          className="-mx-4 mb-10 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {tabs.map((tab) => {
            const selected = tab.slug === active;
            return (
              <button
                key={tab.slug}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${tablistId}-panel`}
                onClick={() => setActive(tab.slug)}
                className={cn(
                  "relative shrink-0 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors duration-300",
                  selected ? "border-transparent text-ivory" : "border-mocha-700/15 text-mocha-600 hover:border-mocha-700/40 hover:text-mocha-800"
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="new-arrivals-pill"
                    className="absolute inset-0 rounded-full bg-mocha-700"
                    transition={{ duration: 0.45, ease: EASE }}
                  />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div id={`${tablistId}-panel`} role="tabpanel" aria-live="polite">
        {filtered.length > 0 ? (
          <motion.ul layout className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((product) => (
                <motion.li
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.55, ease: EASE }}
                >
                  <ProductCard product={product} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 rounded-card border border-dashed border-mocha-700/15 px-6 py-16 text-center"
          >
            <p className="font-heading text-xl text-mocha-700">{t("filterEmptyTitle")}</p>
            <p className="max-w-sm text-sm text-mocha-500">{t("filterEmptyBody")}</p>
            {activeCategory && (
              <Link href={`/category/${activeCategory.slug}`} className="btn-secondary mt-2">
                {t("browseCategory", { name: locale === "ar" ? activeCategory.nameAr : activeCategory.nameEn })}
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
