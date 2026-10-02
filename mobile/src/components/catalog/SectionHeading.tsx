import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight } from "@/components/icons";
import { AppText, Icon } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { spacing } from "@/theme";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  action?: { label: string; onPress: () => void };
};

// The website's section heading: a small gold eyebrow over a serif title,
// with an optional link at the end of the row.
export function SectionHeading({ eyebrow, title, action }: SectionHeadingProps) {
  const locale = useLocale();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        {eyebrow ? (
          <AppText variant="label" color="highlightText" style={locale === "en" && styles.eyebrow}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="title">{title}</AppText>
      </View>
      {action ? (
        <Pressable accessibilityRole="link" onPress={action.onPress} hitSlop={8} style={styles.action}>
          <AppText variant="caption" color="text" style={styles.actionLabel}>
            {action.label}
          </AppText>
          <Icon icon={ChevronRight} size={16} directional />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.md },
  text: { flex: 1, gap: spacing.xs },
  eyebrow: { textTransform: "uppercase", letterSpacing: 1.6 },
  action: { flexDirection: "row", alignItems: "center", gap: spacing.xxs, paddingBottom: spacing.xs },
  actionLabel: { textDecorationLine: "underline" },
});
