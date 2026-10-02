import { Platform, type ViewStyle } from "react-native";

// Spacing on a 4-point grid.
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Corner radii; `card` and `xl2` match the website's borderRadius extension
// (1.5rem and 1.25rem).
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl2: 20,
  card: 24,
  pill: 999,
} as const;

// The website's "soft" shadows, expressed per platform.
function shadow(offsetY: number, blur: number, opacity: number, elevation: number): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#3A2620",
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blur / 2,
    },
    android: { elevation },
    default: { boxShadow: `0 ${offsetY}px ${blur}px rgba(58, 38, 32, ${opacity})` },
  });
}

export const shadows = {
  soft: shadow(4, 24, 0.08, 2),
  softLg: shadow(12, 40, 0.14, 6),
} as const;

// Smallest comfortable touch target (Apple and Android guidance).
export const minTouchTarget = 48;
