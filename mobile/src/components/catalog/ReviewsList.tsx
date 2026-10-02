import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ProductDetail } from "@shared/api-types";
import { AppText, Card } from "@/components/ui";
import { palette, radii, spacing } from "@/theme";
import { RatingStars } from "./RatingStars";

// The website's review list: overall stars and count, then each review.
// Demo reviews keep their "for preview only" badge.
export function ReviewsList({ product }: { product: Pick<ProductDetail, "ratingAvg" | "ratingCount" | "reviews"> }) {
  const t = useTranslations("product");
  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <RatingStars rating={product.ratingAvg} size={18} />
        <AppText variant="caption" color="textMuted">
          {t("reviewsCount", { count: product.ratingCount })}
        </AppText>
      </View>
      {product.reviews.length === 0 ? (
        <AppText variant="body" color="textMuted">
          {t("noReviewsYet")}
        </AppText>
      ) : (
        product.reviews.map((review) => (
          <Card key={review.id} style={styles.review}>
            <View style={styles.reviewHeader}>
              <AppText variant="bodyStrong" style={styles.author} numberOfLines={1}>
                {review.authorName}
              </AppText>
              <RatingStars rating={review.rating} size={12} />
            </View>
            <AppText variant="body" color="textMuted">
              {review.comment}
            </AppText>
            {review.isDemo ? (
              <View style={styles.demoBadge}>
                <AppText variant="caption" style={styles.demoText}>
                  {t("demoReviewBadge")}
                </AppText>
              </View>
            ) : null}
          </Card>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  summary: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  review: { gap: spacing.xs + 2 },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  author: { flex: 1 },
  demoBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: palette.gold[50],
  },
  demoText: { fontSize: 11, lineHeight: 16, color: palette.gold[600] },
});
