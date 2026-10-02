import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from "react-native";
import { colors, minTouchTarget, radii, spacing, type ColorName } from "@/theme";
import { AppText } from "./AppText";

type Variant = "primary" | "secondary" | "accent" | "ghost";

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const looks: Record<Variant, { background: string; pressed: string; border: string; text: ColorName }> = {
  primary: { background: colors.primary, pressed: colors.primaryPressed, border: colors.primary, text: "textInverse" },
  secondary: { background: "transparent", pressed: colors.surfaceMuted, border: colors.borderStrong, text: "text" },
  accent: { background: colors.accentSoft, pressed: colors.accent, border: colors.accentSoft, text: "accentStrong" },
  ghost: { background: "transparent", pressed: colors.surfaceMuted, border: "transparent", text: "text" },
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled,
  icon,
  fullWidth,
  style,
  ...rest
}: ButtonProps) {
  const look = looks[variant];
  const inactive = Boolean(disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={4}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? look.pressed : look.background, borderColor: look.border },
        fullWidth && styles.fullWidth,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[look.text]} />
      ) : (
        <View style={styles.content}>
          {icon}
          <AppText variant="button" color={look.text} numberOfLines={1}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  fullWidth: { alignSelf: "stretch" },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  inactive: { opacity: 0.5 },
});
