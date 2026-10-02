import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import type { ShowcaseItem } from "@shared/api-types";
import { localized } from "@/catalog/product-logic";
import { AppText } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { colors, radii, spacing } from "@/theme";
import { ProductImage } from "./ProductImage";

// The hero's boutique photos (real product and category photography from
// the API), as a swipeable row. Each opens its product or category.
export function ShowcaseCarousel({ items, cardWidth }: { items: ShowcaseItem[]; cardWidth: number }) {
  const locale = useLocale();
  const router = useRouter();
  const height = Math.round(cardWidth * 1.25);
  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => `${item.kind}-${item.id}`}
      renderItem={({ item, index }) => {
        const name = localized(locale, item.nameEn, item.nameAr);
        return (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={name}
            onPress={() =>
              item.kind === "product"
                ? router.push({ pathname: "/product/[slug]", params: { slug: item.slug } })
                : router.push({ pathname: "/category/[slug]", params: { slug: item.slug } })
            }
            style={({ pressed }) => [styles.card, { width: cardWidth, height }, pressed && styles.pressed]}
          >
            <ProductImage uri={item.image} recyclingKey={item.id} priority={index === 0 ? "high" : "normal"} style={StyleSheet.absoluteFill} />
            <View style={styles.caption}>
              <AppText variant="caption" color="text" numberOfLines={1} style={styles.captionText}>
                {name}
              </AppText>
            </View>
          </Pressable>
        );
      }}
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + spacing.md}
      decelerationRate="fast"
      contentContainerStyle={styles.content}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { marginHorizontal: -spacing.lg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: { borderRadius: radii.card, overflow: "hidden", backgroundColor: colors.surfaceMuted, justifyContent: "flex-end" },
  pressed: { opacity: 0.9 },
  caption: {
    margin: spacing.md,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radii.pill,
    backgroundColor: "rgba(251, 245, 239, 0.88)",
    maxWidth: "90%",
  },
  captionText: { fontSize: 12 },
});
