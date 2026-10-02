import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type AccessibilityRole } from "react-native";
import { colors, radii, spacing } from "@/theme";
import { AppText } from "./AppText";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  leading?: ReactNode;
  // "radio" inside a single-choice group; "button" for actions.
  role?: Extract<AccessibilityRole, "radio" | "button" | "tab">;
  accessibilityLabel?: string;
};

// A rounded selectable pill, like the website's category, colour and size
// buttons: mocha when selected, outlined otherwise.
export function Chip({ label, selected = false, onPress, leading, role = "button", accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={role === "button" ? { selected } : { checked: selected, selected }}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => [styles.chip, selected ? styles.selected : styles.idle, pressed && !selected && styles.pressed]}
    >
      <View style={styles.content}>
        {leading}
        <AppText variant="caption" color={selected ? "textInverse" : "textMuted"} style={styles.label} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
  },
  idle: { borderColor: "rgba(58, 38, 32, 0.15)", backgroundColor: colors.surface },
  selected: { borderColor: colors.primary, backgroundColor: colors.primary },
  pressed: { backgroundColor: colors.surfaceMuted },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.xs + 2 },
  label: { fontSize: 13 },
});
