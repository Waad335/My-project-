"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { PromoCodeForm } from "@/components/cart/promo-code-form";
import { DodanaImage } from "@/components/ui/dodana-image";
import { formatEGP } from "@/lib/utils";

export function CartPageContent() {
  const locale = useLocale();
  const t = useTranslations("cart");
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());
  const appliedPromo = useCartStore((s) => s.appliedPromo);
  const discount = appliedPromo?.discountAmount ?? 0;

  if (items.length === 0) {
    return (
      <div className="container-dodana flex flex-col items-center gap-4 py-24 text-center">
        <ShoppingBag size={48} className="text-mocha-300" />
        <h1 className="font-heading text-2xl text-mocha-700">{t("empty")}</h1>
        <p className="text-sm text-mocha-500">{t("emptyBody")}</p>
        <Link href="/" className="btn-primary mt-2">
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-dodana py-10">
      <h1 className="mb-8 font-heading text-3xl text-mocha-700">{t("title")}</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <ul className="flex flex-col gap-4 lg:col-span-2">
          {items.map((item) => {
            const key = `${item.productId}-${item.variantId ?? "base"}`;
            const name = locale === "ar" ? item.nameAr : item.nameEn;
            return (
              <li key={key} className="card-surface flex gap-4 p-4">
                <Link href={`/product/${item.slug}`} className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-ivory-200">
                  <DodanaImage src={item.image} alt={name} fill sizes="80px" className="object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/product/${item.slug}`} className="font-heading text-sm text-mocha-700 hover:underline sm:text-base">
                      {name}
                    </Link>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-mocha-400 hover:text-blush-500"
                      aria-label={t("remove")}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {item.variantLabel && <p className="text-xs text-mocha-400">{item.variantLabel}</p>}
                  <p className="mt-1 text-xs text-mocha-400">
                    {formatEGP(item.unitPrice, locale)} {t("each")}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3 rounded-full border border-mocha-700/15 px-2 py-1">
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mocha-700/5"
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-mocha-700/5"
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <span className="font-semibold text-mocha-700">{formatEGP(item.unitPrice * item.quantity, locale)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="card-surface flex h-fit flex-col gap-4 p-5">
          <h2 className="font-heading text-lg text-mocha-700">{t("title")}</h2>
          <PromoCodeForm />
          <div className="flex flex-col gap-2 border-t border-mocha-700/10 pt-4 text-sm">
            <div className="flex justify-between text-mocha-500">
              <span>{t("subtotal")}</span>
              <span className="font-medium text-mocha-700">{formatEGP(subtotal, locale)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-gold-600">
                <span>{t("discount")}</span>
                <span>−{formatEGP(discount, locale)}</span>
              </div>
            )}
            <div className="flex justify-between text-mocha-500">
              <span>{t("shipping")}</span>
              <span className="text-xs italic text-mocha-400">{t("shippingCalculated")}</span>
            </div>
            <div className="flex justify-between border-t border-mocha-700/10 pt-2 text-base font-semibold text-mocha-700">
              <span>{t("total")}</span>
              <span>{formatEGP(Math.max(subtotal - discount, 0), locale)}</span>
            </div>
          </div>
          <Link href="/checkout" className="btn-primary w-full">
            {t("checkout")}
          </Link>
          <Link href="/" className="text-center text-sm text-mocha-500 hover:text-mocha-700">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}
