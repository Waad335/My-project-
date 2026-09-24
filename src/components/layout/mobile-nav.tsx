"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X, Instagram, Music2, MessageCircle, Heart, ChevronDown, User, Package } from "lucide-react";
import { navCategoryLabel } from "@/lib/categories-nav";
import type { NavCategory } from "@/lib/queries";
import type { MenuShopCategory } from "@/components/layout/categories-menu";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { DodanaImage } from "@/components/ui/dodana-image";

const EASE = [0.22, 1, 0.36, 1] as const;

export function MobileNav({
  navCategories,
  shopCategories,
  signedIn,
  instagramUrl,
  tiktokUrl,
  whatsappGroupUrl,
}: {
  navCategories: NavCategory[];
  shopCategories: MenuShopCategory[];
  signedIn: boolean;
  instagramUrl: string;
  tiktokUrl: string;
  whatsappGroupUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const locale = useLocale();
  const isRtl = locale === "ar";
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const triggerEl = trigger.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      triggerEl?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);
  const primary = [
    { href: "/shop", label: t("shop") },
    { href: "/new-arrivals", label: t("newIn") },
    { href: "/best-sellers", label: t("bestSellers") },
    { href: "/about", label: t("about") },
  ];
  const secondary = [
    { href: "/account", label: signedIn ? t("myAccount") : t("signIn"), icon: User },
    { href: "/wishlist", label: t("wishlist"), icon: Heart },
    { href: "/track-order", label: t("trackOrder"), icon: Package },
  ];
  const offscreen = isRtl ? "-100%" : "100%";

  return (
    <div className="lg:hidden">
      <button
        ref={trigger}
        type="button"
        aria-label={t("openMenu")}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-mocha-700 hover:bg-mocha-700/5"
      >
        <Menu size={22} strokeWidth={1.75} />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("menu")}>
                <motion.button
                  type="button"
                  aria-label={t("closeMenu")}
                  tabIndex={-1}
                  className="absolute inset-0 bg-mocha-900/35 backdrop-blur-[2px]"
                  onClick={close}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                />
                <motion.div
                  className="absolute inset-y-0 end-0 flex w-full max-w-[26rem] flex-col overflow-y-auto bg-ivory shadow-soft-lg"
                  initial={{ x: offscreen }}
                  animate={{ x: 0 }}
                  exit={{ x: offscreen }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <div className="flex h-16 shrink-0 items-center justify-between border-b border-mocha-700/8 px-5">
                    <span className="wordmark text-xl text-mocha-700">DODANA</span>
                    <button
                      ref={closeButton}
                      type="button"
                      onClick={close}
                      aria-label={t("closeMenu")}
                      className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mocha-700/5"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <nav aria-label={t("mainNavigation")} className="flex flex-col px-5 pb-6 pt-4">
                    <ul className="flex flex-col">
                      {primary.map((link, i) => (
                        <motion.li
                          key={link.href}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.12 + i * 0.05, duration: 0.45, ease: EASE }}
                        >
                          <Link
                            href={link.href}
                            onClick={close}
                            aria-current={pathname === link.href ? "page" : undefined}
                            className="flex items-center justify-between border-b border-mocha-700/6 py-4 font-heading text-[1.65rem] leading-none text-mocha-700"
                          >
                            {link.label}
                          </Link>
                        </motion.li>
                      ))}
                    </ul>

                    {shopCategories.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35, duration: 0.5 }}
                        className="mt-7"
                      >
                        <p className="eyebrow mb-3">{t("theEdit")}</p>
                        <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
                          {shopCategories.map((cat) => (
                            <li key={cat.id} className="snap-start">
                              <Link href={`/category/${cat.slug}`} onClick={close} className="flex w-[5.5rem] flex-col gap-2">
                                <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-sand-100">
                                  <DodanaImage src={cat.image} alt="" fill sizes="88px" className="object-cover" />
                                </span>
                                <span className="truncate text-center text-xs font-medium text-mocha-700">
                                  {locale === "ar" ? cat.nameAr : cat.nameEn}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}

                    <div className="mt-7">
                      <p className="eyebrow mb-1">{t("departments")}</p>
                      {navCategories.map((cat) => {
                        const label = navCategoryLabel(cat, locale);
                        const expanded = expandedSlug === cat.slug;
                        const panelId = `mnav-${cat.slug}`;
                        return (
                          <div key={cat.id} className="border-b border-mocha-700/6">
                            <button
                              type="button"
                              onClick={() => setExpandedSlug(expanded ? null : cat.slug)}
                              className="flex w-full items-center justify-between py-3.5 text-[15px] font-medium text-mocha-700"
                              aria-expanded={expanded}
                              aria-controls={panelId}
                            >
                              {label}
                              <ChevronDown
                                size={16}
                                aria-hidden="true"
                                className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                              />
                            </button>
                            <AnimatePresence initial={false}>
                              {expanded && (
                                <motion.div
                                  id={panelId}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.35, ease: EASE }}
                                  className="overflow-hidden"
                                >
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pb-4">
                                    <Link
                                      href={`/category/${cat.slug}`}
                                      onClick={close}
                                      className="col-span-2 py-1.5 text-xs font-semibold text-gold-600"
                                    >
                                      {tc("viewAll")} {label}
                                    </Link>
                                    {cat.subcategories.map((sub) => (
                                      <Link
                                        key={sub.id}
                                        href={`/category/${cat.slug}?sub=${sub.slug}`}
                                        onClick={close}
                                        className="truncate py-1.5 text-[13px] text-mocha-600"
                                      >
                                        {locale === "ar" ? sub.nameAr : sub.nameEn}
                                      </Link>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>

                    <ul className="mt-6 flex flex-col gap-1">
                      {secondary.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={close}
                            className="flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-mocha-600"
                          >
                            <link.icon size={17} strokeWidth={1.75} aria-hidden="true" />
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  <div className="mt-auto flex items-center justify-between border-t border-mocha-700/8 px-5 py-5">
                    <LocaleSwitcher />
                    <div className="flex items-center gap-2">
                      {[
                        { href: instagramUrl, label: "Instagram", icon: Instagram },
                        { href: tiktokUrl, label: "TikTok", icon: Music2 },
                        { href: whatsappGroupUrl, label: "WhatsApp", icon: MessageCircle },
                      ].map((s) => (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-mocha-700/15 text-mocha-600 transition hover:border-gold-400 hover:text-gold-500"
                        >
                          <s.icon size={16} />
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
