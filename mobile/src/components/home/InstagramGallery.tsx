import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ShopCategory } from "@shared/api-types";
import { localized } from "@/catalog/product-logic";
import { ProductImage } from "@/components/catalog/ProductImage";
import { AppText, Button } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { radii, spacing } from "@/theme";

const TILE_COUNT = 5;
// The website's studio photo, added after the category photos.
const STUDIO_PHOTO = "/hero/hero-visual.png";

const isPlaceholder = (url: string) => url.includes("/placeholders/");

// "Follow the Boutique". The website shows the latest posts from its
// connected Instagram account and tops them up with the store's own
// category photography; the app API doesn't include those posts, so the
// app shows the photography (the website's own fallback). Every tile and
// the handle open the store's Instagram.
export function InstagramGallery({
  categories,
  instagramUrl,
  siteUrl,
  width,
}: {
  categories: ShopCategory[];
  instagramUrl: string | null;
  siteUrl: string | null;
  width: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const site = siteUrl?.replace(/\/$/, "") ?? null;
  const tiles = [
    ...categories
      .filter((c) => c.productCount > 0 && c.image && !isPlaceholder(c.image))
      .map((c) => ({ key: c.id, image: c.image, alt: localized(locale, c.nameEn, c.nameAr) })),
    ...(site ? [{ key: "studio", image: `${site}${STUDIO_PHOTO}`, alt: t("home.galleryStudioAlt") }] : []),
  ].slice(0, TILE_COUNT);
  if (tiles.length === 0) return null;

  const open = instagramUrl ? () => void Linking.openURL(instagramUrl) : undefined;
  const half = Math.floor((width - spacing.sm) / 2);

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <AppText variant="label" color="highlightText">
          {t("home.galleryEyebrow")}
        </AppText>
        <AppText variant="title">{t("sections.instagram")}</AppText>
        <AppText variant="body" color="textMuted">
          {t("sections.instagramSubtitle")}
        </AppText>
        {open ? <Button label={t("sections.instagramHandle")} variant="secondary" onPress={open} style={styles.handle} /> : null}
      </View>
      <View style={styles.grid}>
        {tiles.map((tile, i) => {
          const size = i === 0 ? width : half;
          return (
            <Pressable
              key={tile.key}
              accessibilityRole="link"
              accessibilityLabel={`${tile.alt} — ${t("home.viewOnInstagram")}`}
              disabled={!open}
              onPress={open}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <ProductImage uri={tile.image} style={[styles.tile, { width: size, height: size }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xl },
  heading: { gap: spacing.sm },
  handle: { marginTop: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: { borderRadius: radii.lg },
  pressed: { opacity: 0.85 },
});
