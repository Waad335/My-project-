"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X, Instagram, MessageCircle, Heart, ChevronDown } from "lucide-react";
import { NAV_LABEL_OVERRIDE } from "@/lib/categories-nav";
import type { NavCategory } from "@/lib/queries";

export function MobileNav({
  navCategories,
  instagramUrl,
  whatsappGroupUrl,
}: {
  navCategories: NavCategory[];
  instagramUrl: string;
  whatsappGroupUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const locale = useLocale();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const tHero = useTranslations("hero");

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-mocha-700 hover:bg-mocha-700/5"
      >
        <Menu size={22} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex">
            <button aria-label="Close menu" className="absolute inset-0 bg-mocha-900/40" onClick={() => setOpen(false)} />
            <div className="relative flex h-full w-[85%] max-w-xs flex-col bg-ivory p-5 shadow-soft-lg animate-fade-up">
              <div className="mb-6 flex items-center justify-between">
                <span className="font-heading text-xl text-mocha-700">DODANA</span>
                <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 hover:bg-mocha-700/5">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-col gap-1 text-mocha-700">
                <Link href="/" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-white">
                  {t("home")}
                </Link>
                {navCategories.map((cat) => {
                  const override = NAV_LABEL_OVERRIDE[cat.slug];
                  const label = override
                    ? locale === "ar"
                      ? override.ar
                      : override.en
                    : locale === "ar"
                      ? cat.nameAr
                      : cat.nameEn;
                  const expanded = expandedSlug === cat.slug;
                  return (
                    <div key={cat.id}>
                      <button
                        type="button"
                        onClick={() => setExpandedSlug(expanded ? null : cat.slug)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-white"
                        aria-expanded={expanded}
                      >
                        {label}
                        {cat.subcategories.length > 0 && (
                          <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                        )}
                      </button>
                      {expanded && (
                        <div className="flex flex-col gap-0.5 ps-4">
                          <Link
                            href={`/category/${cat.slug}`}
                            onClick={() => setOpen(false)}
                            className="rounded-xl px-3 py-2 text-xs font-semibold text-gold-600 hover:bg-white"
                          >
                            {tc("viewAll")} {label}
                          </Link>
                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/category/${cat.slug}?sub=${sub.slug}`}
                              onClick={() => setOpen(false)}
                              className="rounded-xl px-3 py-2 text-xs text-mocha-500 hover:bg-white"
                            >
                              {locale === "ar" ? sub.nameAr : sub.nameEn}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <Link href="/new-arrivals" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-white">
                  {t("newArrivals")}
                </Link>
                <Link href="/best-sellers" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-white">
                  {t("bestSellers")}
                </Link>
                <Link href="/wishlist" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-white">
                  <Heart size={15} />
                  {t("wishlist")}
                </Link>
                <hr className="my-2 border-mocha-700/10" />
                <Link href="/faq" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-white">
                  {t("faq")}
                </Link>
                <Link href="/contact" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-white">
                  {t("contact")}
                </Link>
                <Link href="/track-order" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-white">
                  {t("trackOrder")}
                </Link>
              </nav>
              <div className="mt-auto flex flex-col items-center gap-3 pt-6">
                <div className="flex items-center gap-3">
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-mocha-700/15 text-mocha-600 transition hover:border-gold-400 hover:text-gold-500"
                  >
                    <Instagram size={16} />
                  </a>
                  <a
                    href={whatsappGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp Group"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-mocha-700/15 text-mocha-600 transition hover:border-gold-400 hover:text-gold-500"
                  >
                    <MessageCircle size={16} />
                  </a>
                </div>
                <p className="text-center font-heading italic text-blush-400">
                  {locale === "ar" ? tHero("titleAr") : tHero("titleEn")}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
