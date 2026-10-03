import { ActivityIndicator, FlatList, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { localized } from "@/catalog/product-logic";
import { ProductImage } from "@/components/catalog/ProductImage";
import { Heart, X } from "@/components/icons";
import { AppText, EmptyState, Icon } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { formatEGP } from "@/i18n/format";
import { useHydrated } from "@/shopping/storage";
import { useWishlistStore, type WishlistItem } from "@/shopping/wishlist-store";
import { colors, radii, shadows, spacing } from "@/theme";

// Saved pieces, like the website's wishlist page: a two-column grid; each
// opens its product (where the colour or size is chosen and it can be added
// to the cart) or can be removed.
export default function WishlistScreen() {
  const t = useTranslations();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const hydrated = useHydrated(useWishlistStore);
  const items = useWishlistStore((s) => s.items);
  const cardWidth = Math.floor((width - spacing.lg * 2 - spacing.md) / 2);

  const header = (
    <View style={styles.header}>
      <AppText variant="title" accessibilityRole="header">
        {t("wishlist.title")}
      </AppText>
      {items.length > 0 ? (
        <AppText variant="caption" color="textMuted">
          {t("account.itemsCount", { count: items.length })}
        </AppText>
      ) : null}
    </View>
  );

  if (!hydrated || items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.padded}>
          {header}
          {!hydrated ? (
            <ActivityIndicator color={colors.textMuted} style={styles.loading} accessibilityLabel={t("common.loading")} />
          ) : (
            <EmptyState
              icon={Heart}
              title={t("wishlist.empty")}
              body={t("wishlist.emptyBody")}
              action={{ label: t("wishlist.continueShopping"), onPress: () => router.navigate("/shop") }}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        numColumns={2}
        renderItem={({ item }) => <SavedPiece item={item} width={cardWidth} />}
        columnWrapperStyle={styles.row}
        ItemSeparatorComponent={RowGap}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function SavedPiece({ item, width }: { item: WishlistItem; width: number }) {
  const t = useTranslations("wishlist");
  const locale = useLocale();
  const router = useRouter();
  const remove = useWishlistStore((s) => s.remove);
  const name = localized(locale, item.nameEn, item.nameAr);
  const price = formatEGP(item.price, locale);
  return (
    <View style={{ width }}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${name}, ${price}`}
        onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: item.slug } })}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <ProductImage uri={item.image} recyclingKey={item.productId} style={{ width, height: Math.round(width * 1.25) }} />
        <View style={styles.body}>
          <AppText variant="heading" numberOfLines={2} style={locale === "ar" ? styles.nameAr : styles.name}>
            {name}
          </AppText>
          <AppText variant="bodyStrong">{price}</AppText>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t("remove")}: ${name}`}
        onPress={() => remove(item.productId)}
        hitSlop={6}
        style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
      >
        <Icon icon={X} size={16} />
      </Pressable>
    </View>
  );
}

function RowGap() {
  return <View style={styles.rowGap} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  header: { gap: spacing.xs, paddingBottom: spacing.lg },
  loading: { marginTop: spacing.xxl },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
  row: { gap: spacing.md },
  rowGap: { height: spacing.xl },
  card: { borderRadius: radii.card, overflow: "hidden", backgroundColor: colors.surface, ...shadows.soft },
  pressed: { opacity: 0.85 },
  body: { padding: spacing.md, gap: spacing.xs },
  name: { fontSize: 15, lineHeight: 20 },
  nameAr: { fontSize: 15, lineHeight: 24 },
  remove: {
    position: "absolute",
    top: spacing.sm,
    end: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    ...shadows.soft,
  },
  removePressed: { backgroundColor: colors.surfaceMuted },
});
