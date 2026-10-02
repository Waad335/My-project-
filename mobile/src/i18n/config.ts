// Same languages and default as the website (src/i18n/config.ts): English
// unless the customer picks Arabic. Like the website, the device language
// is not used to choose for them.
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

// Each language's own name, shown the same way in both languages.
export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};
