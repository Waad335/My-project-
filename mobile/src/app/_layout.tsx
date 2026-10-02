import "@/i18n/polyfills";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/query-client";
import { useSessionStore } from "@/auth/session-store";
import { applyLayoutDirection } from "@/i18n/direction";
import { I18nProvider } from "@/i18n/I18nProvider";
import { useLocaleStore } from "@/i18n/locale-store";
import { colors, fontAssets } from "@/theme";

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
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="dev/design-system"
              options={{
                headerShown: true,
                title: "Design system",
                headerTintColor: colors.text,
                headerStyle: { backgroundColor: colors.background },
              }}
            />
          </Stack>
        </I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
