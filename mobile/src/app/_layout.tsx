import "@/i18n/polyfills";
import { useEffect, useState } from "react";
import { AppState, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useTranslations } from "use-intl";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/query-client";
import { useSessionStore } from "@/auth/session-store";
import { applyLayoutDirection } from "@/i18n/direction";
import { useAccountSync } from "@/shopping/account-sync";
import { I18nProvider, useLocale } from "@/i18n/I18nProvider";
import { useLocaleStore } from "@/i18n/locale-store";
import { colors, fontAssets, textStyle } from "@/theme";

// Screens opened straight from a link (dodana://product/…) still get the
// tabs underneath, so the header's back button always has somewhere to go.
export const unstable_settings = { initialRouteName: "(tabs)" };

// Keep the splash screen up until fonts, language and layout direction are ready.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [localeReady, setLocaleReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const locale = await useLocaleStore.getState().hydrate();
      const restarting = await applyLayoutDirection(locale);
      if (restarting || cancelled) return;
      setLocaleReady(true);
      // Not awaited: an offline start must not hold the app on the splash screen.
      void useSessionStore.getState().hydrate();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Missing fonts fall back to the system font rather than blocking the app.
  const ready = localeReady && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <StatusBar style="dark" />
            <AppStack />
          </I18nProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Tabs, with category and product screens pushed on top (back button in
// the header; it points the other way in Arabic).
function AppStack() {
  // Saves a signed-in customer's cart and wishlist to their account.
  useAccountSync();
  // Back in the foreground: notice an expired session, or confirm one that
  // couldn't be checked at start-up (offline).
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void useSessionStore.getState().revalidate();
    });
    return () => subscription.remove();
  }, []);
  const locale = useLocale();
  const t = useTranslations("app");
  const heading = textStyle("subheading", locale);
  const pushed = {
    headerShown: true,
    headerTintColor: colors.text,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: "minimal",
    // Not shown (minimal), but read out by VoiceOver in the app's language.
    headerBackTitle: t("back"),
    headerTitleAlign: "center",
    headerTitleStyle: { fontFamily: heading.fontFamily, fontSize: 16 },
  } as const;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="category/[slug]" options={pushed} />
      <Stack.Screen name="product/[slug]" options={pushed} />
      <Stack.Screen name="auth/sign-in" options={pushed} />
      <Stack.Screen name="auth/register" options={pushed} />
      <Stack.Screen name="auth/forgot-password" options={pushed} />
      <Stack.Screen name="dev/design-system" options={{ ...pushed, title: "Design system" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
