import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { localized } from "@/catalog/product-logic";
import { SUGGEST_MIN_LENGTH, useSearchSuggestions } from "@/catalog/queries";
import { ArrowRight, Search } from "@/components/icons";
import { AppText, Icon } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { formatEGP } from "@/i18n/format";
import { colors, radii, spacing } from "@/theme";
import { ProductImage } from "./ProductImage";

type SearchSuggestionsProps = {
  query: string;
  // Shows every match in the Shop grid.
  onSeeAll: () => void;
  onNavigate?: () => void;
};

// Up to five matching products while typing (the website's search box
// dropdown), plus "See all results" to search the whole catalogue.
export function SearchSuggestions({ query, onSeeAll, onNavigate }: SearchSuggestionsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const trimmed = query.trim();
  const { data, isFetching, isError } = useSearchSuggestions(query);

  if (trimmed.length < SUGGEST_MIN_LENGTH) {
    return (
      <View style={styles.panel}>
        <AppText variant="body" color="textMuted" style={styles.prompt}>
          {t("search.prompt")}
        </AppText>
      </View>
    );
  }

  const products = data?.products ?? [];
  return (
    <View style={styles.panel}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {products.map((product) => {
          const name = localized(locale, product.nameEn, product.nameAr);
          const price = formatEGP(product.effectivePrice, locale);
          return (
            <Pressable
              key={product.id}
              accessibilityRole="link"
              accessibilityLabel={`${name}, ${price}`}
              onPress={() => {
                onNavigate?.();
                router.push({ pathname: "/product/[slug]", params: { slug: product.slug } });
              }}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <ProductImage uri={product.image} recyclingKey={product.id} style={styles.thumb} />
              <View style={styles.itemText}>
                <AppText variant="body" numberOfLines={1}>
                  {name}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {price}
                </AppText>
              </View>
            </Pressable>
          );
        })}
        {!isFetching && !isError && data && products.length === 0 ? (
          <AppText variant="body" color="textMuted" style={styles.prompt}>
            {t("common.noResults")}
          </AppText>
        ) : null}
        {isFetching && products.length === 0 ? <ActivityIndicator color={colors.textMuted} style={styles.loading} /> : null}
        <Pressable
          accessibilityRole="button"
          onPress={onSeeAll}
          style={({ pressed }) => [styles.item, styles.seeAll, pressed && styles.pressed]}
        >
          <Icon icon={Search} size={18} color="textMuted" />
          <AppText variant="body" style={styles.seeAllText} numberOfLines={1}>
            {t("app.search.seeAll", { query: trimmed })}
          </AppText>
          <Icon icon={ArrowRight} size={16} directional />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  list: { paddingVertical: spacing.xs },
  prompt: { padding: spacing.lg },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  thumb: { width: 44, height: 55, borderRadius: radii.sm },
  itemText: { flex: 1, gap: 2 },
  loading: { paddingVertical: spacing.lg },
  seeAll: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  seeAllText: { flex: 1 },
});
