"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatEGP } from "@/lib/utils";

export function PriceTag({
  price,
  oldPrice,
  size = "md",
}: {
  price: number;
  oldPrice?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const locale = useLocale();
  const t = useTranslations("product");
  const discount = oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  } as const;

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-semibold text-mocha-700 ${sizes[size]}`}>{formatEGP(price, locale)}</span>
      {oldPrice && oldPrice > price && (
        <span className="text-sm text-mocha-400 line-through">{formatEGP(oldPrice, locale)}</span>
      )}
      {discount && (
        <span className="rounded-full bg-blush-100 px-2 py-0.5 text-[11px] font-semibold text-blush-500">
          -{discount}% {t("off")}
        </span>
      )}
    </div>
  );
}
