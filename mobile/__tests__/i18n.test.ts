import { createTranslator } from "use-intl";
import appAr from "@/i18n/messages/app.ar.json";
import appEn from "@/i18n/messages/app.en.json";
import { defaultLocale, isLocale, isRtl, localeNames, locales } from "@/i18n/config";
import { formatEGP } from "@/i18n/format";
import { messages } from "@/i18n/messages";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key));
}

describe("languages", () => {
  it("matches the website: English by default, Arabic right-to-left", () => {
    expect(locales).toEqual(["en", "ar"]);
    expect(defaultLocale).toBe("en");
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("en")).toBe(false);
    expect(isLocale("fr")).toBe(false);
    expect(localeNames).toEqual({ en: "English", ar: "العربية" });
  });

  it("has every app-only string in both languages", () => {
    expect(keyPaths(appAr).sort()).toEqual(keyPaths(appEn).sort());
    for (const path of keyPaths(appAr)) {
      const value = path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], appAr);
      expect(typeof value === "string" && value.trim().length > 0).toBe(true);
      expect(value).toMatch(/[؀-ۿ]/); // actually Arabic
    }
  });

  it("uses the website's text unchanged, with the app's strings in their own namespace", () => {
    for (const locale of locales) {
      const all = messages[locale] as unknown as Record<string, unknown>;
      expect(all.app).toBe(locale === "en" ? appEn : appAr);
      for (const key of ["home", "shop", "wishlist", "cart", "account"]) {
        expect(typeof (all.nav as Record<string, unknown>)[key]).toBe("string");
      }
    }
    expect(messages.en.nav.home).toBe("Home");
    expect(messages.ar.nav.home).toBe("الرئيسية");
  });

  it("formats the website's plural messages in both languages", () => {
    const en = createTranslator({ locale: "en", messages: messages.en });
    const ar = createTranslator({ locale: "ar", messages: messages.ar });
    expect(en("account.itemsCount", { count: 1 })).toBe("1 item");
    expect(en("account.itemsCount", { count: 3 })).toBe("3 items");
    expect(en("shop.results", { count: 0 })).toBe("No products");
    expect(ar("account.itemsCount", { count: 3 })).toMatch(/3|٣/);
  });
});

describe("plural-rules polyfill", () => {
  it("restores Intl.PluralRules on an engine without it", () => {
    const original = Intl.PluralRules;
    try {
      // Simulate an engine with no plural rules, then load the app's polyfills.
      delete (Intl as { PluralRules?: unknown }).PluralRules;
      expect(typeof Intl.PluralRules).toBe("undefined");
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("@/i18n/polyfills");
      });
      expect(typeof Intl.PluralRules).toBe("function");
      expect(new Intl.PluralRules("en").select(1)).toBe("one");
      expect(new Intl.PluralRules("ar").select(2)).toBe("two");
      expect(new Intl.PluralRules("ar").select(11)).toBe("many");
    } finally {
      (Intl as { PluralRules: unknown }).PluralRules = original;
    }
  });
});

describe("formatEGP", () => {
  // Expected values were produced by the website's own formatEGP
  // (src/lib/utils.ts), so prices read identically in the app.
  it.each([
    [1250, "en", "EGP 1,250"],
    [1250, "ar", "١٬٢٥٠ ج.م"],
    [899.5, "en", "EGP 899.50"],
    [899.5, "ar", "٨٩٩٫٥٠ ج.م"],
    [1234567.25, "en", "EGP 1,234,567.25"],
    [1234567.25, "ar", "١٬٢٣٤٬٥٦٧٫٢٥ ج.م"],
    [0, "en", "EGP 0"],
    [0, "ar", "٠ ج.م"],
  ] as const)("%s in %s → %s", (value, locale, expected) => {
    expect(formatEGP(value, locale)).toBe(expected);
  });
});
