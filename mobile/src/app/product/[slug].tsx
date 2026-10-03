import { useRef, useState, type ReactNode } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import type { ProductCard, ProductDetail } from "@shared/api-types";
import { defaultVariantId, detailRows, localized, purchaseState, type StockStatus } from "@/catalog/product-logic";
import { useProduct, useSettings } from "@/catalog/queries";
import { ImageGallery, type GalleryImage } from "@/components/catalog/ImageGallery";
import { ImageViewer } from "@/components/catalog/ImageViewer";
import { NotFoundState, isNotFound } from "@/components/catalog/NotFoundState";
import { ProductRail } from "@/components/catalog/ProductRail";
import { RatingStars } from "@/components/catalog/RatingStars";
import { ReviewsList } from "@/components/catalog/ReviewsList";
import { SectionHeading } from "@/components/catalog/SectionHeading";
import { VariantPicker } from "@/components/catalog/VariantPicker";
import { AddToCart } from "@/components/shopping/AddToCart";
import { RotateCcw, ShieldCheck, Truck, type LucideIcon } from "@/components/icons";
import { AppText, BottomSheet, Divider, ErrorState, Icon, PriceTag, Skeleton } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { colors, palette, radii, spacing } from "@/theme";

// A product, laid out for phones: photos (tap to zoom), name, rating,
// price and stock for the chosen colour/size, delivery, returns and payment
// notes, then description, details, ingredients, reviews and related pieces.
// Add to Cart and the wishlist heart sit under the colour/size choice.
export default function ProductScreen() {
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
  const product = useProduct(slug);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await product.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  if (product.isPending) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: "" }} />
        <ProductSkeleton />
      </View>
    );
  }

  if (product.isError) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: "" }} />
        {isNotFound(product.error) ? <NotFoundState /> : <ErrorState error={product.error} onRetry={() => void product.refetch()} />}
      </View>
    );
  }

  return (
    <ProductContent
      // A different product (e.g. from "You may also like") starts fresh.
      key={product.data.product.id}
      product={product.data.product}
      related={product.data.related}
      refreshing={refreshing}
      onRefresh={refresh}
    />
  );
}

type ProductContentProps = {
  product: ProductDetail;
  related: ProductCard[];
  refreshing: boolean;
  onRefresh: () => void;
};

function ProductContent({ product, related, refreshing, onRefresh }: ProductContentProps) {
  const t = useTranslations();
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const scrollRef = useRef<ScrollView>(null);
  const reviewsY = useRef(0);
  const [variantId, setVariantId] = useState(() => defaultVariantId(product));
  const [viewer, setViewer] = useState<{ open: boolean; index: number; key: number }>({ open: false, index: 0, key: 0 });
  const [policyOpen, setPolicyOpen] = useState(false);

  const name = localized(locale, product.nameEn, product.nameAr);
  const state = purchaseState(product, variantId);
  const description = localized(locale, product.descriptionEn, product.descriptionAr);
  const ingredients = localized(locale, product.ingredientsEn, product.ingredientsAr);
  const warnings = localized(locale, product.warningsEn, product.warningsAr);
  const images: GalleryImage[] = product.images.map((image) => ({
    url: image.url,
    alt: localized(locale, image.altEn, image.altAr) || name,
  }));
  const details = detailRows(product, locale, {
    category: t("product.category"),
    subcategory: t("product.subcategory"),
    color: t("product.color"),
    size: t("product.size"),
    availability: t("product.availability"),
    sku: t("product.sku"),
    inStock: t("product.inStock"),
    outOfStock: t("product.outOfStock"),
  });
  const returnsPolicy = settings.data ? localized(locale, settings.data.returnsPolicyEn, settings.data.returnsPolicyAr) : null;
  // The app takes cash on delivery only; say so only while the store offers it.
  const codAvailable = settings.data?.paymentMethods.includes("COD") ?? false;

  const stockLabel =
    state.stockStatus === "out"
      ? t("product.outOfStock")
      : state.stockStatus === "low"
        ? t("product.lowStockCount", { count: state.stock })
        : t("product.inStock");

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} colors={[colors.primary]} />}
      >
        <ImageGallery images={images} onOpen={(index) => setViewer((v) => ({ open: true, index, key: v.key + 1 }))} />

        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <AppText variant="label" color="highlightText" style={locale === "en" && styles.upper}>
              {localized(locale, product.categoryNameEn, product.categoryNameAr)}
            </AppText>
            <AppText variant="title" accessibilityRole="header">
              {name}
            </AppText>
            <View style={styles.metaRow}>
              {product.ratingCount > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => scrollRef.current?.scrollTo({ y: reviewsY.current, animated: true })}
                  style={styles.ratingLink}
                  hitSlop={6}
                >
                  <RatingStars rating={product.ratingAvg} size={14} />
                  <AppText variant="caption" color="textMuted">
                    {product.ratingAvg.toFixed(1)} · {t("product.reviewsCount", { count: product.ratingCount })}
                  </AppText>
                </Pressable>
              ) : (
                <AppText variant="caption" color="textSubtle">
                  {t("product.noReviewsYet")}
                </AppText>
              )}
              <AppText variant="caption" color="textSubtle">
                {t("product.sku")}: {state.variant?.sku ?? product.sku}
              </AppText>
            </View>
          </View>

          <View style={styles.priceRow}>
            <PriceTag price={state.unitPrice} oldPrice={product.oldPrice} size="lg" />
            <StockPill status={state.stockStatus} label={stockLabel} />
          </View>

          {product.variants.length > 0 ? (
            <View style={styles.variants}>
              <VariantPicker variants={product.variants} selectedId={variantId} onSelect={setVariantId} />
            </View>
          ) : null}

          <AddToCart key={variantId ?? "base"} product={product} state={state} />

          <View style={styles.infoList}>
            <InfoRow icon={Truck} title={t("product.deliveryInfo")} body={t("product.deliveryInfoBody")} />
            <Divider />
            <InfoRow
              icon={RotateCcw}
              title={t("product.returnInfo")}
              body={t("product.returnInfoBody")}
              action={returnsPolicy ? { label: t("product.viewPolicy"), onPress: () => setPolicyOpen(true) } : undefined}
            />
            {codAvailable ? (
              <>
                <Divider />
                <InfoRow icon={ShieldCheck} title={t("product.secureTitle")} body={t("product.paymentCod")} />
              </>
            ) : null}
          </View>

          <Section title={t("product.description")}>
            <AppText variant="body" color="textMuted">
              {description}
            </AppText>
          </Section>

          <Section title={t("product.details")}>
            <View style={styles.details}>
              {details.map(([term, value]) => (
                <View key={term} style={styles.detailRow}>
                  <AppText variant="caption" color="textMuted">
                    {term}
                  </AppText>
                  <AppText variant="bodyStrong" style={styles.detailValue}>
                    {value}
                  </AppText>
                </View>
              ))}
            </View>
          </Section>

          {ingredients || warnings ? (
            <Section title={t("product.ingredientsTab")}>
              {ingredients ? (
                <View style={styles.subSection}>
                  <AppText variant="subheading">{t("product.ingredients")}</AppText>
                  <AppText variant="body" color="textMuted">
                    {ingredients}
                  </AppText>
                </View>
              ) : null}
              {warnings ? (
                <View style={styles.subSection}>
                  <AppText variant="subheading">{t("product.warnings")}</AppText>
                  <AppText variant="body" color="textMuted">
                    {warnings}
                  </AppText>
                </View>
              ) : null}
            </Section>
          ) : null}

          <View
            onLayout={(e) => {
              reviewsY.current = e.nativeEvent.layout.y;
            }}
          >
            <Section title={`${t("sections.reviews")} (${product.ratingCount})`}>
              <ReviewsList product={product} />
            </Section>
          </View>

          {related.length > 0 ? (
            <View style={styles.related}>
              <SectionHeading eyebrow={t("product.relatedEyebrow")} title={t("sections.youMayAlsoLike")} />
              <ProductRail products={related} />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ImageViewer
        key={viewer.key}
        images={images}
        visible={viewer.open}
        initialIndex={viewer.index}
        onClose={() => setViewer((v) => ({ ...v, open: false }))}
      />
      {returnsPolicy ? (
        <BottomSheet visible={policyOpen} title={t("product.returnInfo")} closeLabel={t("app.close")} onClose={() => setPolicyOpen(false)}>
          <AppText variant="body" color="textMuted">
            {returnsPolicy}
          </AppText>
        </BottomSheet>
      ) : null}
    </View>
  );
}

const stockLooks: Record<StockStatus, { background: string; text: string }> = {
  out: { background: palette.blush[50], text: palette.blush[600] },
  low: { background: palette.gold[50], text: palette.gold[600] },
  in: { background: palette.sand[100], text: palette.mocha[600] },
};

function StockPill({ status, label }: { status: StockStatus; label: string }) {
  const look = stockLooks[status];
  return (
    <View style={[styles.stockPill, { backgroundColor: look.background }]}>
      <AppText variant="caption" style={[styles.stockText, { color: look.text }]} accessibilityLiveRegion="polite">
        {label}
      </AppText>
    </View>
  );
}

type InfoRowProps = { icon: LucideIcon; title: string; body: string; action?: { label: string; onPress: () => void } };

function InfoRow({ icon, title, body, action }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon icon={icon} size={18} color="highlight" />
      </View>
      <View style={styles.infoText}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="textMuted">
          {body}
        </AppText>
        {action ? (
          <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8} style={styles.infoAction}>
            <AppText variant="caption" color="text" style={styles.underline}>
              {action.label}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function ProductSkeleton() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Skeleton width="100%" height={420} radius={0} />
      <View style={[styles.body, styles.skeletonBody]}>
        <Skeleton width="30%" height={12} />
        <Skeleton width="80%" height={28} />
        <Skeleton width="40%" height={14} />
        <Skeleton width="35%" height={28} />
        <Skeleton width="100%" height={120} radius={radii.card} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.xl },
  skeletonBody: { gap: spacing.md },
  titleBlock: { gap: spacing.sm },
  upper: { textTransform: "uppercase", letterSpacing: 1.6 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: spacing.lg, rowGap: spacing.xs },
  ratingLink: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stockPill: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  stockText: { fontSize: 12 },
  variants: { gap: spacing.lg },
  infoList: {
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  infoRow: { flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  infoIcon: { paddingTop: 2 },
  infoText: { flex: 1, gap: 2 },
  infoAction: { alignSelf: "flex-start", marginTop: spacing.xs },
  underline: { textDecorationLine: "underline" },
  section: { gap: spacing.md },
  subSection: { gap: spacing.xs },
  details: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  detailValue: { flexShrink: 1, textAlign: "right", writingDirection: "auto" },
  related: { gap: spacing.lg, paddingTop: spacing.md },
});
