import { I18nManager, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reloadAppAsync } from "expo";
import { isRtl, type Locale } from "./config";

// Right-to-left layout for Arabic.
//
// On iOS and Android the layout direction is fixed when the app starts, so
// switching between English and Arabic sets the direction and restarts the
// app once. On the web preview the page's `dir` attribute is enough.

const RELOAD_GUARD_KEY = "dodana.direction-reload";

export function layoutDirectionMatches(locale: Locale): boolean {
  if (Platform.OS === "web") return true;
  return I18nManager.isRTL === isRtl(locale);
}

function applyWebDirection(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
}

// Makes the layout direction match the language. Returns true when the app
// is restarting to apply it (the caller should render nothing further).
export async function applyLayoutDirection(locale: Locale): Promise<boolean> {
  if (Platform.OS === "web") {
    applyWebDirection(locale);
    return false;
  }

  const rtl = isRtl(locale);
  // allowRTL(false) also keeps English left-to-right on phones whose own
  // language is Arabic.
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  if (I18nManager.isRTL === rtl) {
    await AsyncStorage.removeItem(RELOAD_GUARD_KEY).catch(() => undefined);
    return false;
  }

  // Restart at most once per change, so a device that can't switch direction
  // never ends up restarting in a loop.
  const alreadyTried = await AsyncStorage.getItem(RELOAD_GUARD_KEY).catch(() => null);
  if (alreadyTried === locale) return false;
  await AsyncStorage.setItem(RELOAD_GUARD_KEY, locale).catch(() => undefined);
  await reloadAppAsync("Applying the layout direction for the selected language");
  return true;
}
