import type { ColorValue } from "react-native";
import { Tabs } from "expo-router/js-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heart, Home, LayoutGrid, ShoppingBag, User, type LucideIcon } from "@/components/icons";
import { useTranslations } from "use-intl";
import { useLocale } from "@/i18n/I18nProvider";
import { cartCount, tabBadge, useCartStore } from "@/shopping/cart-store";
import { useWishlistStore } from "@/shopping/wishlist-store";
import { colors, textStyle } from "@/theme";

function tabIcon(Glyph: LucideIcon) {
  // eslint-disable-next-line react/display-name
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Glyph color={typeof color === "string" ? color : colors.textMuted} size={size} strokeWidth={1.75} />
  );
}

// The app's five sections. In Arabic the bar mirrors automatically.
export default function TabsLayout() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const label = textStyle("label", locale);
  const insets = useSafeAreaInsets();
  const cartItems = useCartStore((s) => cartCount(s.items));
  const savedPieces = useWishlistStore((s) => s.items.length);
  const badgeStyle = {
    backgroundColor: colors.accentStrong,
    color: colors.textInverse,
    fontFamily: label.fontFamily,
    fontSize: 10,
    lineHeight: locale === "ar" ? 16 : 14,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentStrong,
        tabBarInactiveTintColor: colors.textMuted,
        // Tall enough for Arabic labels (Cairo's letters are taller) and the
        // home indicator / gesture bar.
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64 + insets.bottom,
          paddingTop: 0,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontFamily: label.fontFamily,
          fontSize: 11,
          lineHeight: locale === "ar" ? 18 : 14,
          letterSpacing: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("home"), tabBarIcon: tabIcon(Home) }} />
      <Tabs.Screen name="shop" options={{ title: t("shop"), tabBarIcon: tabIcon(LayoutGrid) }} />
      <Tabs.Screen
        name="wishlist"
        options={{ title: t("wishlist"), tabBarIcon: tabIcon(Heart), tabBarBadge: tabBadge(savedPieces), tabBarBadgeStyle: badgeStyle }}
      />
      <Tabs.Screen
        name="cart"
        options={{ title: t("cart"), tabBarIcon: tabIcon(ShoppingBag), tabBarBadge: tabBadge(cartItems), tabBarBadgeStyle: badgeStyle }}
      />
      <Tabs.Screen name="account" options={{ title: t("account"), tabBarIcon: tabIcon(User) }} />
    </Tabs>
  );
}
