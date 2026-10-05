import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import type { HomeResponse, ProductCard as ProductCardData } from "@shared/api-types";
import { useHome } from "@/catalog/queries";
import { NotFoundState } from "@/components/catalog/NotFoundState";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";
import { AppText, ErrorState } from "@/components/ui";
import { colors, spacing } from "@/theme";

// The website's /best-sellers and /new-arrivals pages, opened from the Home
// sections' "View best sellers" and "View all new arrivals". Their products
// come with the home screen's answer: the best sellers (up to 10) and the
// pieces marked new among its new arrivals (up to 12).
const COLLECTIONS = {
  "best-sellers": { title: "sections.bestSellers", pick: (home: HomeResponse) => home.bestSellers },
  "new-arrivals": { title: "sections.newArrivals", pick: (home: HomeResponse) => home.newArrivals.filter((p) => p.isNewArrival) },
} as const;

type Kind = keyof typeof COLLECTIONS;
const isKind = (value: string): value is Kind => Object.prototype.hasOwnProperty.call(COLLECTIONS, value);

export default function CollectionScreen() {
  const t = useTranslations();
  const { kind = "" } = useLocalSearchParams<{ kind: string }>();
  const home = useHome();
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - spacing.lg * 2 - spacing.md) / 2);

  if (!isKind(kind)) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: "" }} />
        <NotFoundState />
      </View>
    );
  }

  const collection = COLLECTIONS[kind];
  const title = t(collection.title);
  const products: ProductCardData[] = home.data ? collection.pick(home.data) : [];

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title }} />
      {home.isPending ? (
        <View style={styles.content}>
          <ProductGridSkeleton cardWidth={cardWidth} />
        </View>
      ) : home.isError ? (
        <ErrorState error={home.error} onRetry={() => void home.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText variant="title" center accessibilityRole="header">
            {title}
          </AppText>
          {products.length === 0 ? (
            <AppText variant="body" color="textMuted" center style={styles.empty}>
              {t("common.noResults")}
            </AppText>
          ) : (
            <View style={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} width={cardWidth} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, gap: spacing.xl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, rowGap: spacing.xxl },
  empty: { paddingVertical: spacing.xxxl },
});
