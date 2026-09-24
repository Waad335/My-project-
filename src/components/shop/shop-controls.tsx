"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterCategory = { slug: string; nameEn: string; nameAr: string; count: number };

const SORTS = ["featured", "newest", "price-asc", "price-desc"] as const;

// URL-driven controls for /shop: every change updates the query string, so
// results are server-rendered, shareable and survive refresh/back.
export function ShopControls({ categories, total }: { categories: FilterCategory[]; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("shop");
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const firstRender = useRef(true);

  const activeCategory = params.get("category") ?? "";
  const activeSort = (params.get("sort") as (typeof SORTS)[number]) ?? "featured";

  function navigate(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Debounced search-as-you-type.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = setTimeout(() => {
      if ((params.get("q") ?? "") !== query.trim()) navigate({ q: query.trim() || null });
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-col gap-6" data-pending={pending || undefined}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ q: query.trim() || null });
          }}
          className="relative flex-1"
        >
          <label htmlFor="shop-search" className="sr-only">
            {t("searchLabel")}
          </label>
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute start-5 top-1/2 -translate-y-1/2 text-mocha-400" />
          <input
            id="shop-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="input-field h-14 rounded-full bg-white ps-12 pe-12 text-[15px] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                navigate({ q: null });
              }}
              aria-label={t("clearSearch")}
              className="absolute end-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-mocha-500 hover:bg-mocha-700/5"
            >
              <X size={16} />
            </button>
          )}
        </form>

        <div className="relative md:w-64">
          <label htmlFor="shop-sort" className="sr-only">
            {t("sortLabel")}
          </label>
          <select
            id="shop-sort"
            value={activeSort}
            onChange={(e) => navigate({ sort: e.target.value === "featured" ? null : e.target.value })}
            className="input-field h-14 cursor-pointer appearance-none rounded-full bg-white pe-12 ps-5 text-[15px]"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`sort.${s}`)}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute end-5 top-1/2 -translate-y-1/2 text-mocha-500" />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label={t("categoriesLabel")} className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
          <ul className="flex gap-2 sm:flex-wrap">
            {[{ slug: "", nameEn: t("all"), nameAr: t("all"), count: -1 }, ...categories].map((cat) => {
              const selected = cat.slug === activeCategory;
              return (
                <li key={cat.slug || "all"} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => navigate({ category: cat.slug || null })}
                    className={cn(
                      "relative rounded-full border px-5 py-2.5 text-sm font-medium transition-colors duration-300",
                      selected ? "border-transparent text-ivory" : "border-mocha-700/15 text-mocha-600 hover:border-mocha-700/40 hover:text-mocha-800"
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="shop-category-pill"
                        className="absolute inset-0 rounded-full bg-mocha-700"
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                    <span className="relative">{locale === "ar" ? cat.nameAr : cat.nameEn}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <p className="shrink-0 text-sm text-mocha-500" aria-live="polite">
          {pending ? t("updating") : t("results", { count: total })}
        </p>
      </div>
    </div>
  );
}
