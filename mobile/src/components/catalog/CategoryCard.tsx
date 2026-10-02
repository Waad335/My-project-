import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { ShopCategory } from "@shared/api-types";
import { localized } from "@/catalog/product-logic";
import { AppText } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { colors, radii, spacing } from "@/theme";
import { ProductImage } from "./ProductImage";

// A "Shop by Category" card: the category photo with its name and number
// of pieces over a soft dark fade, as on the website.
export function CategoryCard({ category, width }: { category: ShopCategory; width: number }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const name = localized(locale, category.nameEn, category.nameAr);
  const height = Math.round(width * 1.25);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${name}, ${t("pieces", { count: category.productCount })}`}
      onPress={() => router.push({ pathname: "/category/[slug]", params: { slug: category.slug } })}
      style={({ pressed }) => [{ width, height }, styles.card, pressed && styles.pressed]}
    >
      <ProductImage uri={category.image} recyclingKey={category.id} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={["rgba(28, 18, 16, 0)", "rgba(28, 18, 16, 0.6)"]} locations={[0, 1]} style={styles.shade} />
      <View style={styles.caption}>
        <AppText variant="heading" color="textInverse" numberOfLines={2} accessibilityRole="text">
          {name}
        </AppText>
        <AppText variant="caption" color="textInverse" style={styles.count}>
          {t("pieces", { count: category.productCount })}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.card, overflow: "hidden", backgroundColor: colors.surfaceMuted, justifyContent: "flex-end" },
  pressed: { opacity: 0.9 },
  // A soft dark fade behind the name, like the website's category tiles.
  shade: { ...StyleSheet.absoluteFill, top: "35%" },
  caption: { padding: spacing.md, gap: spacing.xxs },
  count: { opacity: 0.85 },
});
