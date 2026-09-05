"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatEGP } from "@/lib/utils";

export function CartDrawer() {
  const locale = useLocale();
  const t = useTranslations("cart");
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close cart"
        className="absolute inset-0 bg-mocha-900/40 backdrop-blur-sm"
        onClick={close}
      />
      <div className="relative flex h-full w-full max-w-md flex-col bg-ivory shadow-soft-lg animate-fade-up">
        <div className="flex items-center justify-between border-b border-mocha-700/10 px-5 py-4">
          <h2 className="font-heading text-lg text-mocha-700">{t("title")}</h2>
          <button onClick={close} aria-label="Close" className="rounded-full p-2 hover:bg-mocha-700/5">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag size={40} className="text-mocha-300" />
            <p className="font-heading text-lg text-mocha-600">{t("empty")}</p>
            <p className="text-sm text-mocha-400">{t("emptyBody")}</p>
            <button onClick={close} className="btn-secondary mt-2">
              {t("continueShopping")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col gap-4">
                {items.map((item) => {
                  const key = `${item.productId}-${item.variantId ?? "base"}`;
                  const name = locale === "ar" ? item.nameAr : item.nameEn;
                  return (
                    <li key={key} className="flex gap-3">
                      <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-ivory-200">
                        {item.image && (
                          <Image src={item.image} alt={name} fill sizes="64px" className="object-cover" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-medium text-mocha-700">{name}</p>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="text-mocha-400 hover:text-blush-500"
                            aria-label={t("remove")}
                          >
                            <X size={15} />
                          </button>
                        </div>
                        {item.variantLabel && <p className="text-xs text-mocha-400">{item.variantLabel}</p>}
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-full border border-mocha-700/15 px-1.5 py-1">
                            <button
                              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-mocha-700/5"
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-4 text-center text-xs font-medium">{item.quantity}</span>
                            <button
                              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-mocha-700/5"
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-mocha-700">
                            {formatEGP(item.unitPrice * item.quantity, locale)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-mocha-700/10 px-5 py-4">
              <div className="mb-1 flex items-center justify-between text-sm text-mocha-500">
                <span>{t("subtotal")}</span>
                <span className="font-semibold text-mocha-700">{formatEGP(subtotal, locale)}</span>
              </div>
              <p className="mb-3 text-xs text-mocha-400">{t("shippingCalculated")}</p>
              <Link href="/checkout" onClick={close} className="btn-primary w-full">
                {t("checkout")}
              </Link>
              <button onClick={close} className="mt-2 w-full text-center text-sm text-mocha-500 hover:text-mocha-700">
                {t("continueShopping")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
