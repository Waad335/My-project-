import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors, radii, spacing } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Icon } from "./Icon";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
};

// A calm, centred message for screens with nothing to show yet.
export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon icon={icon} size={28} color="accentStrong" />
      </View>
      <AppText variant="heading" center>
        {title}
      </AppText>
      {body ? (
        <AppText variant="body" color="textMuted" center>
          {body}
        </AppText>
      ) : null}
      {action ? <Button label={action.label} variant="secondary" onPress={action.onPress} style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  action: { alignSelf: "center", marginTop: spacing.sm },
});
