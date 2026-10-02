import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors, type ColorName } from "@/theme";
import { useIsRtl } from "@/i18n/I18nProvider";

type IconProps = {
  icon: LucideIcon;
  size?: number;
  color?: ColorName;
  // Arrows and chevrons point the other way in Arabic.
  directional?: boolean;
  strokeWidth?: number;
};

// The website's icon set (lucide), in the app's colours. Icons are
// decorative and hidden from screen readers: pair them with text or an
// accessibility label on the control.
export function Icon({ icon: Glyph, size = 22, color = "text", directional = false, strokeWidth = 1.75 }: IconProps) {
  const rtl = useIsRtl();
  return (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, directional && rtl && styles.mirrored]}
    >
      <Glyph size={size} color={colors[color]} strokeWidth={strokeWidth} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center" },
  mirrored: { transform: [{ scaleX: -1 }] },
});
