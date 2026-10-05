import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useTranslations } from "use-intl";
import type { ShowcaseItem } from "@shared/api-types";
import { AppText, Button } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { formatNumber } from "@/i18n/format";
import { palette, spacing } from "@/theme";
import { ArchFrame } from "./ArchFrame";

// "The DODANA edit" (the website's ShowcaseEditorial on phones): the title,
// three showcase photos in arches inside a gold ring, the three lines and
// "Shop everything". The website reveals the lines one by one as you
// scroll; here they're listed together.
export function ShowcaseEditorial({ items, onShopEverything }: { items: ShowcaseItem[]; onShopEverything: () => void }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  if (items.length === 0) return null;
  // aspect-square w-full max-w-[min(100%,52svh)]
  const size = Math.round(Math.min(screenWidth - spacing.lg * 2, screenHeight * 0.52));
  const [main, left, right] = items;
  const mainW = Math.round(size * 0.46);
  const leftW = Math.round(size * 0.29);
  const rightW = Math.round(size * 0.27);
  const lines = [t("showcaseLine1"), t("showcaseLine2"), t("showcaseLine3")];

  return (
    <View style={styles.section}>
      <View style={styles.copy}>
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowLine} />
          <AppText variant="label" color="highlightText" style={locale === "en" && styles.upper}>
            {t("showcaseEyebrow")}
          </AppText>
        </View>
        <AppText variant="display">{t("showcaseTitle")}</AppText>
      </View>

      <View style={[styles.stage, { width: size, height: size }]}>
        <View pointerEvents="none" style={[styles.ring, { borderRadius: size / 2, margin: size * 0.03 }]} />
        {left ? <ArchFrame item={left} width={leftW} height={Math.round((leftW * 4.2) / 3)} style={[styles.absolute, { bottom: size * 0.04, start: size * 0.03 }]} /> : null}
        {right ? <ArchFrame item={right} width={rightW} height={Math.round((rightW * 4.2) / 3)} style={[styles.absolute, { top: size * 0.04, end: size * 0.03 }]} /> : null}
        {main ? (
          <ArchFrame
            item={main}
            width={mainW}
            height={Math.round((mainW * 4.4) / 3)}
            style={[styles.absolute, styles.front, { start: (size - mainW) / 2, top: (size - (mainW * 4.4) / 3) / 2 }]}
          />
        ) : null}
      </View>

      <View style={styles.lines}>
        {lines.map((line, i) => (
          <View key={line} style={styles.line}>
            <AppText variant="caption" color="highlightText" style={styles.lineNumber}>
              {formatNumber(i + 1, locale, { minimumIntegerDigits: 2 })}
            </AppText>
            <AppText variant="subheading" style={styles.lineText}>
              {line}
            </AppText>
          </View>
        ))}
      </View>
      <Button label={t("shopEverything")} onPress={onShopEverything} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Full width, on the website's sand background.
  section: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
    gap: spacing.xl,
    backgroundColor: palette.sand[100],
  },
  copy: { gap: spacing.md },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  eyebrowLine: { width: 32, height: 1, backgroundColor: palette.gold[400] },
  upper: { textTransform: "uppercase", letterSpacing: 1.6 },
  stage: { alignSelf: "center" },
  ring: { ...StyleSheet.absoluteFill, borderWidth: 0.8, borderColor: palette.gold[400], opacity: 0.7 },
  absolute: { position: "absolute" },
  front: { zIndex: 2 },
  lines: { gap: spacing.sm },
  line: { flexDirection: "row", alignItems: "baseline", gap: spacing.lg },
  lineNumber: { fontFamily: "Fraunces_500Medium" },
  lineText: { flexShrink: 1 },
});
