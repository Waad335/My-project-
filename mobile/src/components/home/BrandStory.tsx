import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { ProductImage } from "@/components/catalog/ProductImage";
import { ArrowRight } from "@/components/icons";
import { AppText, Icon } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { palette, radii, spacing } from "@/theme";

// The website's photo for this section (src/components/home/brand-story.tsx).
const STORY_PHOTO = "/categories/perfumes.jpg";

// "Our story": the website's arch photo, title and two paragraphs. "Read our
// story" opens the website's About page in the browser.
export function BrandStory({ siteUrl, width }: { siteUrl: string | null; width: number }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const site = siteUrl?.replace(/\/$/, "") ?? null;
  return (
    <View style={styles.section}>
      <ProductImage
        uri={site ? `${site}${STORY_PHOTO}` : null}
        accessibilityLabel={t("storyImageAlt")}
        style={[styles.photo, { width, height: Math.round((width * 5) / 4), borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2 }]}
      />
      <View style={styles.copy}>
        <AppText variant="label" color="highlightText" style={locale === "en" && styles.upper}>
          {t("storyEyebrow")}
        </AppText>
        <AppText variant="title">{t("storyTitle")}</AppText>
        <View style={styles.hairline} />
        <AppText variant="body" color="textMuted">
          {t("storyBody1")}
        </AppText>
        <AppText variant="body" color="textMuted">
          {t("storyBody2")}
        </AppText>
        {site ? (
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`${site}/about`)} hitSlop={8} style={styles.link}>
            <AppText variant="bodyStrong" style={styles.linkText}>
              {t("storyCta")}
            </AppText>
            <Icon icon={ArrowRight} size={15} directional />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xxl },
  photo: { borderBottomLeftRadius: radii.card, borderBottomRightRadius: radii.card, backgroundColor: palette.sand[100] },
  copy: { gap: spacing.lg },
  upper: { textTransform: "uppercase", letterSpacing: 1.6 },
  hairline: { width: 96, height: 1, backgroundColor: palette.gold[400] },
  link: { flexDirection: "row", alignItems: "center", gap: spacing.xs, alignSelf: "flex-start", marginTop: spacing.xs },
  linkText: { fontSize: 14, textDecorationLine: "underline" },
});
