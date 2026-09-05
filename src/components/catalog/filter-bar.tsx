"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

type Subcategory = { slug: string; nameEn: string; nameAr: string };

export function FilterBar({ subcategories }: { subcategories: Subcategory[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("common");

  const activeSub = searchParams.get("sub") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateParam("sub", "")}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              !activeSub
                ? "border-mocha-700 bg-mocha-700 text-ivory"
                : "border-mocha-700/15 text-mocha-600 hover:border-mocha-700/40"
            }`}
          >
            {t("viewAll")}
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub.slug}
              onClick={() => updateParam("sub", sub.slug)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                activeSub === sub.slug
                  ? "border-mocha-700 bg-mocha-700 text-ivory"
                  : "border-mocha-700/15 text-mocha-600 hover:border-mocha-700/40"
              }`}
            >
              {locale === "ar" ? sub.nameAr : sub.nameEn}
            </button>
          ))}
        </div>
      )}

      <select
        value={activeSort}
        onChange={(e) => updateParam("sort", e.target.value)}
        className="w-full rounded-full border border-mocha-700/15 bg-white px-4 py-2 text-xs font-medium text-mocha-600 sm:w-auto"
        aria-label={t("sort")}
      >
        <option value="newest">{locale === "ar" ? "الأحدث" : "Newest"}</option>
        <option value="price-asc">{locale === "ar" ? "السعر: من الأقل للأعلى" : "Price: Low to High"}</option>
        <option value="price-desc">{locale === "ar" ? "السعر: من الأعلى للأقل" : "Price: High to Low"}</option>
        <option value="rating">{locale === "ar" ? "الأعلى تقييمًا" : "Top Rated"}</option>
      </select>
    </div>
  );
}
