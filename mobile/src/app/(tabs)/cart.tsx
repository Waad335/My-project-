import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { localized } from "@/catalog/product-logic";
import { ProductImage } from "@/components/catalog/ProductImage";
import { ShoppingBag, X } from "@/components/icons";
import { QuantityStepper } from "@/components/shopping/QuantityStepper";
import { AppText, Button, Card, Divider, EmptyState, Icon } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/I18nProvider";
import { formatEGP } from "@/i18n/format";
import { cartCount, cartLineLimit, cartSubtotal, useCartStore, type CartItem } from "@/shopping/cart-store";
import { useHydrated } from "@/shopping/storage";
import { colors, radii, spacing } from "@/theme";

// The cart, like the website's cart page: each piece with its photo,
// colour/size, price, quantity and a remove button, then the subtotal.
// Checkout arrives in Phase 6.
export default function CartScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const hydrated = useHydrated(useCartStore);
  const items = useCartStore((s) => s.items);
  const subtotal = cartSubtotal(items);

  const header = (
    <View style={styles.header}>
      <AppText variant="title" accessibilityRole="header">
        {t("cart.title")}
      </AppText>
      {items.length > 0 ? (
        <AppText variant="caption" color="textMuted">
          {t("account.itemsCount", { count: cartCount(items) })}
        </AppText>
      ) : null}
    </View>
  );

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.padded}>{header}</View>
        <ActivityIndicator color={colors.textMuted} style={styles.loading} accessibilityLabel={t("common.loading")} />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.padded}>
          {header}
          <EmptyState
            icon={ShoppingBag}
            title={t("cart.empty")}
            body={t("cart.emptyBody")}
            action={{ label: t("cart.continueShopping"), onPress: () => router.navigate("/shop") }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.productId}:${item.variantId ?? "base"}`}
        renderItem={({ item }) => <CartLine item={item} locale={locale} />}
        ItemSeparatorComponent={LineGap}
        ListHeaderComponent={header}
        ListFooterComponent={
          <Card style={styles.summary}>
            <SummaryRow label={t("cart.subtotal")} value={formatEGP(subtotal, locale)} />
            <SummaryRow label={t("cart.shipping")} value={t("cart.shippingCalculated")} muted />
            <Divider />
            <SummaryRow label={t("cart.total")} value={formatEGP(subtotal, locale)} strong />
            <AppText variant="caption" color="textMuted" center>
              {t("app.cart.checkoutSoon")}
            </AppText>
            <Button label={t("cart.continueShopping")} variant="secondary" fullWidth onPress={() => router.navigate("/shop")} />
          </Card>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function CartLine({ item, locale }: { item: CartItem; locale: Locale }) {
  const t = useTranslations("cart");
  const router = useRouter();
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const name = localized(locale, item.nameEn, item.nameAr);
  const openProduct = () => router.push({ pathname: "/product/[slug]", params: { slug: item.slug } });

  return (
    <Card style={styles.line}>
      <View style={styles.lineRow}>
        <Pressable accessibilityRole="link" accessibilityLabel={name} onPress={openProduct}>
          <ProductImage uri={item.image} recyclingKey={`${item.productId}:${item.variantId}`} style={styles.thumb} />
        </Pressable>
        <View style={styles.lineBody}>
          <View style={styles.lineTop}>
            <Pressable accessibilityRole="link" onPress={openProduct} style={styles.lineName}>
              <AppText variant="heading" style={locale === "ar" ? styles.nameAr : styles.name} numberOfLines={2}>
                {name}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t("remove")}: ${name}`}
              onPress={() => removeItem(item.productId, item.variantId)}
              hitSlop={10}
              style={styles.remove}
            >
              <Icon icon={X} size={18} color="textMuted" />
            </Pressable>
          </View>
          {item.variantLabel ? (
            <AppText variant="caption" color="textMuted">
              {item.variantLabel}
            </AppText>
          ) : null}
          <AppText variant="caption" color="textMuted">
            {formatEGP(item.unitPrice, locale)} {t("each")}
          </AppText>
          <View style={styles.lineBottom}>
            <QuantityStepper
              compact
              value={item.quantity}
              max={cartLineLimit(item)}
              onChange={(quantity) => updateQuantity(item.productId, item.variantId, quantity)}
              decreaseLabel={t("decrease")}
              increaseLabel={t("increase")}
            />
            <AppText variant="bodyStrong">{formatEGP(item.unitPrice * item.quantity, locale)}</AppText>
          </View>
        </View>
      </View>
    </Card>
  );
}

function SummaryRow({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  // Arabic type has no italic; the note stays upright there.
  const locale = useLocale();
  return (
    <View style={styles.summaryRow}>
      <AppText variant={strong ? "bodyStrong" : "body"} color={strong ? "text" : "textMuted"}>
        {label}
      </AppText>
      <AppText variant={strong ? "subheading" : "body"} color={muted ? "textMuted" : "text"} style={muted && locale === "en" && styles.italic}>
        {value}
      </AppText>
    </View>
  );
}

function LineGap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  header: { gap: spacing.xs, paddingBottom: spacing.lg },
  loading: { marginTop: spacing.xxl },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
  gap: { height: spacing.md },
  line: { padding: spacing.md },
  lineRow: { flexDirection: "row", gap: spacing.md },
  thumb: { width: 80, height: 100, borderRadius: radii.md },
  lineBody: { flex: 1, gap: spacing.xxs },
  lineTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  lineName: { flex: 1 },
  name: { fontSize: 15, lineHeight: 20 },
  nameAr: { fontSize: 15, lineHeight: 24 },
  remove: { padding: spacing.xxs },
  lineBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginTop: spacing.sm },
  summary: { marginTop: spacing.xl, gap: spacing.md },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  italic: { fontStyle: "italic" },
});
