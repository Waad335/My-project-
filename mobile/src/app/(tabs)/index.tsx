import { useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { ProductCard as ProductCardData, ShopCategory } from "@shared/api-types";
import { localized } from "@/catalog/product-logic";
import { useHome, useSettings } from "@/catalog/queries";
import { CategoryCard } from "@/components/catalog/CategoryCard";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductRail } from "@/components/catalog/ProductRail";
import { SectionHeading } from "@/components/catalog/SectionHeading";
import { ShowcaseCarousel } from "@/components/catalog/ShowcaseCarousel";
import { Search, ShoppingBag } from "@/components/icons";
import { AppText, Button, Chip, ErrorState, Icon, Skeleton, Wordmark } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { colors, palette, radii, spacing } from "@/theme";

const NEW_ARRIVALS_VISIBLE = 8;

// Home: the website homepage for phones — announcement, hero with the
// boutique photos, Shop by Category, departments, Featured, New Arrivals
// (with category tabs) and Best Sellers. Pull down to refresh.
export default function HomeScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const home = useHome();
  const settings = useSettings();
  const scrollRef = useRef<ScrollView>(null);
  const categoriesY = useRef(0);
  const [refreshing, setRefreshing] = useState(false);

  const halfWidth = Math.floor((width - spacing.lg * 2 - spacing.md) / 2);
  const announcement = settings.data ? localized(locale, settings.data.announcementEn, settings.data.announcementAr) : null;

  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([home.refetch(), settings.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  const scrollToCategories = () => scrollRef.current?.scrollTo({ y: categoriesY.current, animated: true });
  const goToShop = () => router.navigate("/shop");

  const data = home.data;
  const catalogIsEmpty = data ? data.featured.length === 0 && data.newArrivals.length === 0 : false;
  // The API falls back to best sellers for "Featured" when few are flagged;
  // don't show the same row twice.
  const showBestSellers = data ? data.bestSellers.length > 0 && !sameProducts(data.bestSellers, data.featured) : false;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {announcement ? (
        <View style={styles.announcement}>
          <AppText variant="caption" color="textInverse" center numberOfLines={2}>
            {announcement}
          </AppText>
        </View>
      ) : null}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textMuted} colors={[colors.primary]} />}
      >
        <View style={styles.topBar}>
          <Wordmark size={24} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("nav.search")}
            onPress={() => router.navigate({ pathname: "/shop", params: { focus: "1" } })}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Icon icon={Search} size={20} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowLine} />
            <AppText variant="label" color="highlightText" style={locale === "en" && styles.upper}>
              {t("hero.eyebrow")}
            </AppText>
          </View>
          <AppText variant="display" accessibilityRole="header">
            {t("hero.headline")}
          </AppText>
          <AppText variant="body" color="textMuted">
            {t("hero.lead")}
          </AppText>
          <View style={styles.heroButtons}>
            <Button label={t("hero.shopNow")} onPress={goToShop} />
            <Button label={t("hero.explore")} variant="secondary" onPress={scrollToCategories} />
          </View>
          <View style={styles.points}>
            {[t("hero.pointSaudi"), t("hero.pointDelivery")].map((point) => (
              <View key={point} style={styles.point}>
                <View style={styles.pointDot} />
                <AppText variant="caption" color="textMuted">
                  {point}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {home.isPending ? (
          <HomeSkeleton cardWidth={halfWidth} />
        ) : home.isError || !data ? (
          <ErrorState error={home.error} onRetry={() => void home.refetch()} />
        ) : (
          <>
            {data.showcase.length > 0 ? <ShowcaseCarousel items={data.showcase} cardWidth={Math.round(width * 0.7)} /> : null}

            <View
              style={styles.section}
              onLayout={(e) => {
                categoriesY.current = e.nativeEvent.layout.y;
              }}
            >
              <SectionHeading
                eyebrow={t("home.categoriesEyebrow")}
                title={t("home.categoriesTitle")}
                action={{ label: t("home.shopEverything"), onPress: goToShop }}
              />
              <CategoryGrid categories={data.shopCategories} cardWidth={halfWidth} />
            </View>

            {data.departments.length > 0 ? (
              <View style={styles.section}>
                <SectionHeading title={t("nav.departments")} />
                <View style={styles.chipsWrap}>
                  {data.departments.map((d) => (
                    <Chip
                      key={d.id}
                      role="button"
                      label={localized(locale, d.nameEn, d.nameAr)}
                      onPress={() => router.push({ pathname: "/category/[slug]", params: { slug: d.slug } })}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {catalogIsEmpty ? (
              <ComingSoon onExplore={scrollToCategories} />
            ) : (
              <>
                {data.featured.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeading eyebrow={t("home.featuredEyebrow")} title={t("home.featuredTitle")} />
                    <AppText variant="body" color="textMuted">
                      {t("home.featuredSubtitle")}
                    </AppText>
                    <ProductRail products={data.featured} />
                  </View>
                ) : null}

                {data.newArrivals.length > 0 ? (
                  <NewArrivals products={data.newArrivals} categories={data.shopCategories} cardWidth={halfWidth} />
                ) : null}

                {showBestSellers ? (
                  <View style={styles.section}>
                    <SectionHeading title={t("sections.bestSellers")} />
                    <ProductRail products={data.bestSellers} />
                  </View>
                ) : null}

                <Button label={t("home.shopEverything")} variant="secondary" onPress={goToShop} style={styles.shopAll} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function sameProducts(a: ProductCardData[], b: ProductCardData[]): boolean {
  return a.length === b.length && a.every((p, i) => p.id === b[i]?.id);
}

function CategoryGrid({ categories, cardWidth }: { categories: ShopCategory[]; cardWidth: number }) {
  return (
    <View style={styles.grid}>
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} width={cardWidth} />
      ))}
    </View>
  );
}

// The website's New Arrivals: category tabs over the newest pieces, eight
// at a time.
function NewArrivals({ products, categories, cardWidth }: { products: ProductCardData[]; categories: ShopCategory[]; cardWidth: number }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const [active, setActive] = useState<string>("all");
  const visible = useMemo(
    () => (active === "all" ? products : products.filter((p) => p.categorySlug === active)).slice(0, NEW_ARRIVALS_VISIBLE),
    [active, products]
  );
  const activeCategory = categories.find((c) => c.slug === active);
  const tabs = [{ slug: "all", label: t("filterAll") }, ...categories.map((c) => ({ slug: c.slug, label: localized(locale, c.nameEn, c.nameAr) }))];

  return (
    <View style={styles.section}>
      <SectionHeading eyebrow={t("newEyebrow")} title={t("newTitle")} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
        accessibilityRole="tablist"
        accessibilityLabel={t("filterLabel")}
      >
        {tabs.map((tab) => (
          <Chip key={tab.slug} role="tab" label={tab.label} selected={tab.slug === active} onPress={() => setActive(tab.slug)} />
        ))}
      </ScrollView>
      {visible.length > 0 ? (
        <View style={styles.grid} accessibilityLiveRegion="polite">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} width={cardWidth} />
          ))}
        </View>
      ) : (
        <View style={styles.filterEmpty}>
          <AppText variant="heading" center>
            {t("filterEmptyTitle")}
          </AppText>
          <AppText variant="body" color="textMuted" center>
            {t("filterEmptyBody")}
          </AppText>
          {activeCategory ? (
            <Button
              label={t("browseCategory", { name: localized(locale, activeCategory.nameEn, activeCategory.nameAr) })}
              variant="secondary"
              onPress={() => router.push({ pathname: "/category/[slug]", params: { slug: activeCategory.slug } })}
              style={styles.centered}
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

// Shown instead of the product sections while the catalogue is empty, as on
// the website.
function ComingSoon({ onExplore }: { onExplore: () => void }) {
  const t = useTranslations("sections");
  return (
    <View style={styles.section}>
      <AppText variant="title" center>
        {t("comingSoonTitle")}
      </AppText>
      <View style={styles.comingSoon}>
        <View style={styles.comingSoonIcon}>
          <Icon icon={ShoppingBag} size={24} color="accent" strokeWidth={1.5} />
        </View>
        <AppText variant="body" color="textMuted" center>
          {t("comingSoonBody")}
        </AppText>
        <Button label={t("comingSoonCta")} variant="secondary" onPress={onExplore} style={styles.centered} />
      </View>
    </View>
  );
}

function HomeSkeleton({ cardWidth }: { cardWidth: number }) {
  return (
    <View style={styles.section} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Skeleton height={Math.round(cardWidth * 1.6)} radius={radii.card} />
      <Skeleton width="40%" height={12} />
      <Skeleton width="65%" height={24} />
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} width={cardWidth} height={Math.round(cardWidth * 1.25)} radius={radii.card} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  announcement: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xxxl },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.md, marginBottom: -spacing.xl },
  iconButton: { width: 44, height: 44, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  iconButtonPressed: { backgroundColor: colors.surfaceMuted },
  hero: { gap: spacing.lg },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  eyebrowLine: { width: 32, height: 1, backgroundColor: colors.highlight },
  upper: { textTransform: "uppercase", letterSpacing: 1.6 },
  heroButtons: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xs },
  points: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.xl, rowGap: spacing.xs },
  point: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pointDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.highlight },
  section: { gap: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, rowGap: spacing.xl },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chipsScroll: { marginHorizontal: -spacing.lg, flexGrow: 0 },
  chipsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterEmpty: {
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    borderRadius: radii.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  centered: { alignSelf: "center" },
  comingSoon: {
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    borderRadius: radii.card,
    backgroundColor: palette.blush[50],
  },
  comingSoonIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  shopAll: { alignSelf: "center" },
});
