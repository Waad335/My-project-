import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { defaultLocale, isLocale, type Locale } from "./config";

// The customer's chosen language, remembered on the device. It is a
// preference, not a secret, so ordinary app storage is fine.
export const LOCALE_STORAGE_KEY = "dodana.locale";

type LocaleState = {
  locale: Locale;
  hydrated: boolean;
  hydrate: () => Promise<Locale>;
  setLocale: (locale: Locale) => Promise<void>;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: defaultLocale,
  hydrated: false,
  hydrate: async () => {
    let locale: Locale = defaultLocale;
    try {
      const saved = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(saved)) locale = saved;
    } catch {
      // Unreadable storage: fall back to the default language.
    }
    set({ locale, hydrated: true });
    return locale;
  },
  setLocale: async (locale) => {
    set({ locale });
    try {
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // The choice still applies for this session.
    }
  },
}));
