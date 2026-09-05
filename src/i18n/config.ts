export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeCookieName = "DODANA_LOCALE";

export function isRtl(locale: string): boolean {
  return locale === "ar";
}
