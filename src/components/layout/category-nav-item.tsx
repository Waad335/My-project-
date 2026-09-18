"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import type { NavCategory } from "@/lib/queries";

export function CategoryNavItem({ category, label }: { category: NavCategory; label: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function closeSoon() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <Link
        href={`/category/${category.slug}`}
        className="flex items-center gap-1 text-sm font-medium text-mocha-600 transition hover:text-mocha-800"
        aria-expanded={open}
      >
        {label}
        {category.subcategories.length > 0 && (
          <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </Link>

      {open && category.subcategories.length > 0 && (
        <div className="absolute start-0 top-full z-40 mt-3 w-[min(90vw,640px)] rounded-card border border-mocha-700/5 bg-white p-5 shadow-soft-lg">
          <Link
            href={`/category/${category.slug}`}
            className="mb-3 inline-block text-xs font-semibold uppercase tracking-wide text-gold-600 hover:text-gold-700"
          >
            {t("viewAll")} {label}
          </Link>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {category.subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${category.slug}?sub=${sub.slug}`}
                className="truncate text-sm text-mocha-600 transition hover:text-mocha-800"
              >
                {locale === "ar" ? sub.nameAr : sub.nameEn}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
