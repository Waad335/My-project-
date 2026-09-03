"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { NAV_CATEGORIES } from "@/lib/categories-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("nav");

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

      {open && (
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
              {NAV_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-white"
                >
                  <span aria-hidden="true">{cat.emoji}</span>
                  {t(cat.labelKey)}
                </Link>
              ))}
              <Link href="/new-arrivals" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-white">
                {t("newArrivals")}
              </Link>
              <Link href="/best-sellers" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-white">
                {t("bestSellers")}
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
            <p className="mt-auto pt-6 text-center font-heading italic text-blush-400">
              {locale === "ar" ? "لقيناها عشانك 💗" : "Good taste, already found."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
