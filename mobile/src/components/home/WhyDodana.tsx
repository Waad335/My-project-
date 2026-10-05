import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { AppText } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { formatNumber } from "@/i18n/format";
import { palette, radii, spacing } from "@/theme";

const HAIRLINE = "rgba(58, 38, 32, 0.08)";

// "Why DODANA": the website's four numbered statements on a hairline grid.
export function WhyDodana() {
  const t = useTranslations("home");
  const locale = useLocale();
  const items = [
    { title: t("whyCuratedTitle"), body: t("whyCuratedBody") },
    { title: t("whyQualityTitle"), body: t("whyQualityBody") },
    { title: t("whySaudiTitle"), body: t("whySaudiBody") },
    { title: t("whyDeliveryTitle"), body: t("whyDeliveryBody") },
  ];
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <AppText variant="label" color="highlightText" style={locale === "en" && styles.upper}>
          {t("whyEyebrow")}
        </AppText>
        <AppText variant="title">{t("whyTitle")}</AppText>
      </View>
      <View style={styles.list}>
        {items.map((item, i) => (
          <View key={item.title} style={[styles.item, i > 0 && styles.divider]}>
            <AppText variant="caption" color="highlightText" style={styles.number}>
              {formatNumber(i + 1, locale, { minimumIntegerDigits: 2 })}
            </AppText>
            <AppText variant="heading">{item.title}</AppText>
            <AppText variant="caption" color="textMuted" style={styles.body}>
              {item.body}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
    gap: spacing.xl,
    backgroundColor: palette.ivory[50],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: HAIRLINE,
  },
  heading: { gap: spacing.sm },
  upper: { textTransform: "uppercase", letterSpacing: 1.6 },
  list: { borderRadius: radii.card, borderWidth: 1, borderColor: HAIRLINE, overflow: "hidden", backgroundColor: palette.ivory[50] },
  item: { padding: spacing.xl, gap: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: HAIRLINE },
  number: { fontFamily: "Fraunces_500Medium" },
  body: { lineHeight: 21 },
});
