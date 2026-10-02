import { StyleSheet, Text, type TextProps } from "react-native";
import { colors, textStyle, wordmarkStyle, type ColorName, type TextVariant } from "@/theme";
import type { Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/I18nProvider";

const HEADING_VARIANTS: TextVariant[] = ["display", "title", "heading"];

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: ColorName;
  center?: boolean;
  // For text in a specific language regardless of the app's language (e.g.
  // "العربية" in the language picker), so it gets that script's font.
  fontLocale?: Locale;
};

// All app text goes through here: it picks Fraunces/DM Sans for English and
// Cairo for Arabic, and aligns to the start of the line in either direction.
export function AppText({
  variant = "body",
  color = "text",
  center,
  fontLocale,
  style,
  accessibilityRole,
  ...rest
}: AppTextProps) {
  const appLocale = useLocale();
  const locale = fontLocale ?? appLocale;
  return (
    <Text
      accessibilityRole={accessibilityRole ?? (HEADING_VARIANTS.includes(variant) ? "header" : undefined)}
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[textStyle(variant, locale), { color: colors[color] }, center && styles.center, style]}
    />
  );
}

// The DODANA wordmark, as in the website header.
export function Wordmark({ size = 28, color = "text" }: { size?: number; color?: ColorName }) {
  return (
    <Text
      accessibilityRole="header"
      accessibilityLabel="DODANA"
      maxFontSizeMultiplier={1.3}
      style={[wordmarkStyle, { fontSize: size, lineHeight: Math.round(size * 1.25), color: colors[color] }]}
    >
      DODANA
    </Text>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
});
