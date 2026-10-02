import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import { activeFilterCount, type BrowseFilters } from "@/catalog/filters";
import { localized } from "@/catalog/product-logic";
import { useCategory } from "@/catalog/queries";
import { NotFoundState, isNotFound } from "@/components/catalog/NotFoundState";
import { ProductBrowser } from "@/components/catalog/ProductBrowser";
import { AppText, Chip, ErrorState } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { colors, spacing } from "@/theme";

// The website's category pages default to newest first.
const DEFAULT_FILTERS: BrowseFilters = { sort: "newest" };

// A category: its description, subcategory chips (as on the website) and
// its products with sort and price filters.
export default function CategoryScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
  const category = useCategory(slug);
  const [sub, setSub] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<BrowseFilters>(DEFAULT_FILTERS);

  const data = category.data?.category;
  const name = data ? localized(locale, data.nameEn, data.nameAr) : "";
  const description = data ? localized(locale, data.descriptionEn, data.descriptionAr) : null;

  if (category.isError && isNotFound(category.error)) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: "" }} />
        <NotFoundState />
      </View>
    );
  }

  if (category.isError) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: "" }} />
        <ErrorState error={category.error} onRetry={() => void category.refetch()} />
      </View>
    );
  }

  const subcategories = data?.subcategories ?? [];

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: name }} />
      <ProductBrowser
        scope={{ category: slug, sub }}
        filters={filters}
        defaultSort={DEFAULT_FILTERS.sort}
        onFiltersChange={setFilters}
        narrowed={Boolean(sub || activeFilterCount(filters, DEFAULT_FILTERS.sort))}
        onClearAll={() => {
          setSub(undefined);
          setFilters(DEFAULT_FILTERS);
        }}
        header={
          <View style={styles.header}>
            {description ? (
              <AppText variant="body" color="textMuted">
                {description}
              </AppText>
            ) : null}
            {subcategories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsRow}
                accessibilityRole="radiogroup"
                accessibilityLabel={t("product.subcategory")}
              >
                <Chip role="radio" label={t("shop.all")} selected={!sub} onPress={() => setSub(undefined)} />
                {subcategories.map((s) => (
                  <Chip
                    key={s.id}
                    role="radio"
                    label={localized(locale, s.nameEn, s.nameAr)}
                    selected={sub === s.slug}
                    onPress={() => setSub(s.slug)}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { gap: spacing.lg, paddingTop: spacing.sm },
  chipsScroll: { marginHorizontal: -spacing.lg, flexGrow: 0 },
  chipsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
});
