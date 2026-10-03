import { StyleSheet, View } from "react-native";
import { CircleAlert, CircleCheck } from "@/components/icons";
import { colors, palette, radii, spacing } from "@/theme";
import { AppText } from "./AppText";
import { Icon } from "./Icon";

type FormMessageProps = { tone: "error" | "success" | "info"; message: string };

// One message for a whole form: what went wrong, or that it worked. Read
// out by screen readers as soon as it appears.
export function FormMessage({ tone, message }: FormMessageProps) {
  const look = looks[tone];
  return (
    <View
      style={[styles.box, { backgroundColor: look.background, borderColor: look.border }]}
      accessibilityRole={tone === "error" ? "alert" : undefined}
      accessibilityLiveRegion="polite"
    >
      <Icon icon={tone === "success" ? CircleCheck : CircleAlert} size={18} color={look.icon} />
      <AppText variant="body" color="text" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const looks = {
  error: { background: colors.dangerSoft, border: palette.blush[200], icon: "danger" },
  success: { background: palette.sand[100], border: colors.border, icon: "text" },
  info: { background: palette.gold[50], border: palette.gold[100], icon: "highlightText" },
} as const;

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, borderRadius: radii.md, borderWidth: 1 },
  text: { flex: 1 },
});
