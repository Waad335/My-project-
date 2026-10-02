import type { Locale } from "./config";

// Prices exactly as the website shows them (formatEGP in src/lib/utils.ts):
// "EGP 1,250" in English and "١٬٢٥٠ ج.م" in Arabic.
export function formatEGP(value: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return locale === "ar" ? `${formatted} ج.م` : `EGP ${formatted}`;
}
