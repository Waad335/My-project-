import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { ProductCard as ProductCardData } from "@shared/api-types";
import { cardBadge, isOutOfStock, LOW_STOCK_THRESHOLD, localized } from "@/catalog/product-logic";
import { AppText, PriceTag } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { formatEGP } from "@/i18n/format";
import { palette, radii, spacing } from "@/theme";
import { ProductImage } from "./ProductImage";
import { RatingStars } from "./RatingStars";

type ProductCardProps = { product: ProductCardData; width: number };

// The website's product tile for phones: photo with one badge, category,
// name, rating, price and a low-stock note. Add-to-cart and the wishlist
// heart arrive with the cart and wishlist (Phase 4).
function ProductCardBase({ product, width }: ProductCardProps) {
  const t = useTranslations("product");
  const locale = useLocale();
  const router = useRouter();
  const name = localized(locale, product.nameEn, product.nameAr);
  const badge = cardBadge(product);
  const outOfStock = isOutOfStock(product);
  const lowStock = product.trackStock && !outOfStock && product.stock < LOW_STOCK_THRESHOLD;

  const badgeLabel =
    badge?.kind === "sale" ? `-${badge.discount}%` : badge?.kind === "bestSeller" ? t("bestSeller") : badge?.kind === "new" ? t("new") : null;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${name}, ${formatEGP(product.effectivePrice, locale)}${outOfStock ? `, ${t("outOfStock")}` : ""}`}
      onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: product.slug } })}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
    >
      <View>
        <ProductImage
          uri={product.image}
          recyclingKey={product.id}
          style={{ width, height: Math.round(width * 1.25), borderRadius: radii.card }}
        />
        {badge && badgeLabel ? (
          <View style={[styles.badge, badgeStyles[badge.kind]]}>
            <AppText variant="label" style={[styles.badgeText, { color: badgeText[badge.kind] }]}>
              {badgeLabel}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <AppText variant="label" color="highlightText" numberOfLines={1} style={locale === "en" && styles.eyebrow}>
          {localized(locale, product.categoryNameEn, product.categoryNameAr)}
        </AppText>
        <AppText variant="heading" accessibilityRole="text" numberOfLines={2} style={locale === "ar" ? styles.nameAr : styles.name}>
          {name}
        </AppText>
        {product.ratingCount > 0 ? (
          <View style={styles.rating}>
            <RatingStars rating={product.ratingAvg} size={12} />
            <AppText variant="caption" color="textMuted" style={styles.ratingCount}>
              ({product.ratingCount})
            </AppText>
          </View>
        ) : null}
        <PriceTag price={product.effectivePrice} oldPrice={product.oldPrice} size="sm" showDiscount={false} />
        {lowStock ? (
          <AppText variant="caption" color="highlightText">
            {t("lowStockCount", { count: product.stock })}
          </AppText>
        ) : null}
        {outOfStock ? (
          <AppText variant="caption" color="textMuted">
            {t("outOfStock")}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardBase);

const badgeStyles = StyleSheet.create({
  sale: { backgroundColor: palette.blush[600] },
  bestSeller: { backgroundColor: palette.gold[400] },
  new: { backgroundColor: palette.mocha[700] },
});
const badgeText = { sale: "#FFFFFF", bestSeller: palette.mocha[800], new: palette.ivory[100] } as const;

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  badge: {
    position: "absolute",
    top: spacing.md,
    start: spacing.md,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xxs + 1,
  },
  badgeText: { fontSize: 11, letterSpacing: 0 },
  body: { paddingTop: spacing.md, gap: spacing.xs },
  eyebrow: { textTransform: "uppercase", letterSpacing: 1.6, fontSize: 10.5 },
  // The website sets card names in the heading face at 15px.
  name: { fontSize: 15, lineHeight: 20 },
  nameAr: { fontSize: 15, lineHeight: 24 },
  rating: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  ratingCount: { fontSize: 11 },
});
