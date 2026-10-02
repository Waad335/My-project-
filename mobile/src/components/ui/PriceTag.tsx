import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { palette, radii, spacing } from "@/theme";
import { useLocale } from "@/i18n/I18nProvider";
import { formatEGP } from "@/i18n/format";
import { AppText } from "./AppText";

type PriceTagProps = {
  price: number;
  oldPrice?: number | null;
  size?: "sm" | "md" | "lg";
  showDiscount?: boolean;
};

// Same rules as the website's PriceTag: the selling price, the old price
// struck through when it is higher, and the percentage saved.
export function PriceTag({ price, oldPrice, size = "md", showDiscount = true }: PriceTagProps) {
  const locale = useLocale();
  const t = useTranslations("product");
  const hasOldPrice = oldPrice != null && oldPrice > price;
  const discount = hasOldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  return (
    <View style={styles.row}>
      <AppText variant={size === "lg" ? "title" : "bodyStrong"} style={size === "sm" && styles.small}>
        {formatEGP(price, locale)}
      </AppText>
      {hasOldPrice && (
        <AppText variant="caption" color="textMuted" style={styles.struck}>
          {formatEGP(oldPrice, locale)}
        </AppText>
      )}
      {showDiscount && discount ? (
        <View style={styles.badge}>
          <AppText variant="label" color="danger">
            -{discount}% {t("off")}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: spacing.sm },
  small: { fontSize: 14 },
  struck: { textDecorationLine: "line-through" },
  badge: {
    backgroundColor: palette.blush[100],
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
});
