import { AccessibilityInfo, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTranslations } from "use-intl";
import type { WishlistItem } from "@/shopping/wishlist-store";
import { useIsWishlisted, useWishlistStore } from "@/shopping/wishlist-store";
import { Heart } from "@/components/icons";
import { colors, radii, shadows } from "@/theme";

type WishlistButtonProps = {
  item: WishlistItem;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

// The website's heart: saves or removes a piece from the wishlist. Filled
// blush when saved. Screen readers hear the action and the result.
export function WishlistButton({ item, size = 36, style }: WishlistButtonProps) {
  const t = useTranslations();
  const saved = useIsWishlisted(item.productId);
  const toggle = useWishlistStore((s) => s.toggle);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? t("product.removeFromWishlist") : t("product.addToWishlist")}
      accessibilityState={{ selected: saved }}
      onPress={() => {
        const nowSaved = toggle(item);
        AccessibilityInfo.announceForAccessibility(nowSaved ? t("app.wishlist.saved") : t("app.wishlist.removed"));
      }}
      hitSlop={6}
      style={({ pressed }) => [styles.button, { width: size, height: size }, pressed && styles.pressed, style]}
    >
      <View aria-hidden importantForAccessibility="no-hide-descendants">
        <Heart
          size={Math.round(size * 0.45)}
          color={saved ? colors.accentStrong : colors.text}
          fill={saved ? colors.accentStrong : "transparent"}
          strokeWidth={1.75}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    ...shadows.soft,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
});
