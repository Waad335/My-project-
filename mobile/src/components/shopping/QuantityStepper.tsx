import { Pressable, StyleSheet, View } from "react-native";
import { Minus, Plus } from "@/components/icons";
import { AppText, Icon } from "@/components/ui";
import { colors, radii, spacing } from "@/theme";

type QuantityStepperProps = {
  value: number;
  max: number;
  onChange: (quantity: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  // A smaller version for cart lines.
  compact?: boolean;
};

// − 2 + : never below 1 or above the available stock, like the website.
export function QuantityStepper({ value, max, onChange, decreaseLabel, increaseLabel, compact = false }: QuantityStepperProps) {
  const size = compact ? 36 : 48;
  const canDecrease = value > 1;
  const canIncrease = value < max;
  return (
    <View style={[styles.box, { minHeight: size }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={decreaseLabel}
        accessibilityState={{ disabled: !canDecrease }}
        disabled={!canDecrease}
        onPress={() => onChange(value - 1)}
        hitSlop={4}
        style={({ pressed }) => [styles.button, { width: size, height: size }, pressed && styles.pressed, !canDecrease && styles.disabled]}
      >
        <Icon icon={Minus} size={compact ? 14 : 16} />
      </Pressable>
      <AppText variant="bodyStrong" style={styles.value} accessibilityLiveRegion="polite">
        {value}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={increaseLabel}
        accessibilityState={{ disabled: !canIncrease }}
        disabled={!canIncrease}
        onPress={() => onChange(value + 1)}
        hitSlop={4}
        style={({ pressed }) => [styles.button, { width: size, height: size }, pressed && styles.pressed, !canIncrease && styles.disabled]}
      >
        <Icon icon={Plus} size={compact ? 14 : 16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(58, 38, 32, 0.15)",
    backgroundColor: colors.surface,
  },
  button: { alignItems: "center", justifyContent: "center", borderRadius: radii.pill },
  pressed: { backgroundColor: colors.surfaceMuted },
  disabled: { opacity: 0.35 },
  value: { minWidth: 28, textAlign: "center", paddingHorizontal: spacing.xs },
});
