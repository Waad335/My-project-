import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { Star } from "@/components/icons";
import { roundedRating } from "@/catalog/product-logic";
import { colors } from "@/theme";

// Five stars, filled to the nearest whole star of the half-star-rounded
// rating (as on the website), read out as "4.5 out of 5 stars".
export function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  const t = useTranslations("app");
  const rounded = roundedRating(rating);
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel={t("rating", { rating })}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= rounded;
        return (
          <Star
            key={i}
            size={size}
            color={filled ? colors.highlight : "rgba(58, 38, 32, 0.2)"}
            fill={filled ? colors.highlight : "transparent"}
            strokeWidth={1.5}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
});
