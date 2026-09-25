"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { DodanaImage } from "@/components/ui/dodana-image";
import { formatEGP } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export function CartDrawer() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("cart");
  const pathname = usePathname();
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());
  const count = useCartStore((s) => s.count());
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // Close when navigating (e.g. to checkout or a product). Only touch the
  // store if the drawer is actually open: any set() before the persisted cart
  // has rehydrated would make the persist middleware overwrite the saved cart
  // with the empty initial state.
  useEffect(() => {
    if (useCartStore.getState().isDrawerOpen) close();
  }, [pathname, close]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      // Keep keyboard focus inside the drawer while it's open.
      if (e.key === "Tab" && panel.current) {
        const focusable = panel.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, close]);

  const offscreen = isRtl ? "-100%" : "100%";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
          <motion.button
            type="button"
            tabIndex={-1}
            aria-label={t("close")}
            className="absolute inset-0 bg-mocha-900/35 backdrop-blur-[2px]"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
          <motion.div
            ref={panel}
            className="absolute inset-y-0 end-0 flex w-full max-w-[28rem] flex-col bg-ivory shadow-soft-lg"
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-mocha-700/8 px-6">
              <h2 id="cart-drawer-title" className="font-heading text-xl text-mocha-700">
                {t("title")}
                {count > 0 && <span className="ms-2 text-sm text-mocha-400">({count})</span>}
              </h2>
              <button
                ref={closeButton}
                type="button"
                onClick={close}
                aria-label={t("close")}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mocha-700/5"
              >
                <X size={20} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-sand-100 text-mocha-400">
                  <ShoppingBag size={26} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <p className="font-heading text-xl text-mocha-700">{t("empty")}</p>
                <p className="text-sm text-mocha-500">{t("emptyBody")}</p>
                <Link href="/shop" onClick={close} className="btn-primary mt-4">
                  {t("continueShopping")}
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto px-6 py-2" aria-live="polite">
                  <AnimatePresence initial={false}>
                    {items.map((item, i) => {
                      const key = `${item.productId}-${item.variantId ?? "base"}`;
                      const name = locale === "ar" ? item.nameAr : item.nameEn;
                      const atMax = item.quantity >= (item.maxStock || 99);
                      return (
                        <motion.li
                          key={key}
                          layout
                          initial={{ opacity: 0, x: isRtl ? -24 : 24 }}
                          animate={{ opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE, delay: 0.15 + i * 0.04 } }}
                          exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
                          className="overflow-hidden border-b border-mocha-700/8 last:border-0"
                        >
                          <div className="flex gap-4 py-5">
                            <Link
                              href={`/product/${item.slug}`}
                              onClick={close}
                              className="relative h-28 w-[5.5rem] shrink-0 overflow-hidden rounded-2xl bg-sand-100"
                              tabIndex={-1}
                              aria-hidden="true"
                            >
                              <DodanaImage src={item.image} alt="" fill sizes="88px" className="object-cover" />
                            </Link>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <Link
                                    href={`/product/${item.slug}`}
                                    onClick={close}
                                    className="line-clamp-2 font-heading text-[15px] leading-snug text-mocha-700 hover:text-gold-600"
                                  >
                                    {name}
                                  </Link>
                                  {item.variantLabel && <p className="mt-0.5 text-xs text-mocha-500">{item.variantLabel}</p>}
                                  <p className="mt-1 text-xs text-mocha-400">
                                    {formatEGP(item.unitPrice, locale)} {t("each")}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.productId, item.variantId)}
                                  className="shrink-0 text-xs font-medium text-mocha-400 underline-offset-4 hover:text-blush-500 hover:underline"
                                  aria-label={`${t("remove")} — ${name}`}
                                >
                                  {t("remove")}
                                </button>
                              </div>
                              <div className="mt-auto flex items-center justify-between pt-3">
                                <div className="flex items-center rounded-full border border-mocha-700/15">
                                  <button
                                    type="button"
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-mocha-600 hover:bg-mocha-700/5 disabled:opacity-35"
                                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    aria-label={t("decrease")}
                                  >
                                    <Minus size={13} />
                                  </button>
                                  <span className="w-6 text-center text-sm font-medium tabular-nums" aria-live="polite">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-mocha-600 hover:bg-mocha-700/5 disabled:opacity-35"
                                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                                    disabled={atMax}
                                    aria-label={t("increase")}
                                  >
                                    <Plus size={13} />
                                  </button>
                                </div>
                                <span className="text-sm font-semibold text-mocha-700">
                                  {formatEGP(item.unitPrice * item.quantity, locale)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>

                <div className="border-t border-mocha-700/8 bg-ivory-50 px-6 pb-6 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-mocha-600">{t("subtotal")}</span>
                    <span className="text-lg font-semibold text-mocha-700">{formatEGP(subtotal, locale)}</span>
                  </div>
                  <p className="mb-5 mt-1 text-xs text-mocha-400">{t("shippingCalculated")}</p>
                  <Link href="/checkout" onClick={close} className="btn-primary w-full py-4 tracking-[0.14em] rtl:tracking-normal">
                    {t("checkout")}
                  </Link>
                  <Link
                    href="/cart"
                    onClick={close}
                    className="mt-3 block w-full text-center text-sm font-medium text-mocha-600 hover:text-mocha-800"
                  >
                    {t("viewCart")}
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
