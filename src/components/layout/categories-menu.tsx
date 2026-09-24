"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { navCategoryLabel } from "@/lib/categories-nav";
import type { NavCategory } from "@/lib/queries";
import { DodanaImage } from "@/components/ui/dodana-image";

export type MenuShopCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  image: string | null;
};

const SUBCATEGORY_LIMIT = 7;

// Desktop "Categories" mega-menu: the curated beauty categories (with
// imagery) plus every department and its first few subcategories.
export function CategoriesMenu({
  label,
  departments,
  shopCategories,
}: {
  label: string;
  departments: NavCategory[];
  shopCategories: MenuShopCategory[];
}) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const isActive = pathname.startsWith("/category/");

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  }

  // Close on route change.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  return (
    <div
      ref={root}
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`nav-link flex items-center gap-1 ${isActive || open ? "text-mocha-800 after:scale-x-100" : ""}`}
      >
        {label}
        <ChevronDown size={13} aria-hidden="true" className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full z-40 border-b border-mocha-700/8 bg-ivory shadow-soft-lg"
          >
            <div className="container-dodana grid grid-cols-[minmax(0,1fr)_19rem] gap-10 py-9 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div>
                <p className="eyebrow mb-5">{t("departments")}</p>
                <div className="grid grid-cols-5 gap-6">
                  {departments.map((dept) => {
                    const deptLabel = navCategoryLabel(dept, locale);
                    return (
                      <div key={dept.id} className="min-w-0">
                        <Link
                          href={`/category/${dept.slug}`}
                          className="mb-3 block font-heading text-lg text-mocha-700 transition-colors hover:text-gold-600"
                        >
                          {deptLabel}
                        </Link>
                        <ul className="flex flex-col gap-2">
                          {dept.subcategories.slice(0, SUBCATEGORY_LIMIT).map((sub) => (
                            <li key={sub.id}>
                              <Link
                                href={`/category/${dept.slug}?sub=${sub.slug}`}
                                className="block truncate text-[13px] text-mocha-600 transition-colors hover:text-mocha-800"
                              >
                                {locale === "ar" ? sub.nameAr : sub.nameEn}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {dept.subcategories.length > SUBCATEGORY_LIMIT && (
                          <Link
                            href={`/category/${dept.slug}`}
                            className="mt-3 inline-block text-xs font-semibold text-gold-600 hover:text-gold-500"
                          >
                            {tc("viewAll")}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {shopCategories.length > 0 && (
                <div className="border-s border-mocha-700/8 ps-8">
                  <p className="eyebrow mb-5">{t("theEdit")}</p>
                  <ul className="flex flex-col gap-1">
                    {shopCategories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={`/category/${cat.slug}`}
                          className="group flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-white"
                        >
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                            <DodanaImage
                              src={cat.image}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover transition-transform duration-500 ease-luxe group-hover:scale-110"
                            />
                          </span>
                          <span className="flex-1 text-sm font-medium text-mocha-700">
                            {locale === "ar" ? cat.nameAr : cat.nameEn}
                          </span>
                          <ArrowUpRight
                            size={16}
                            aria-hidden="true"
                            className="text-mocha-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-600 rtl:-scale-x-100"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href="/shop" className="link-underline mt-5 text-sm font-semibold text-mocha-700">
                    {t("shopAll")}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
