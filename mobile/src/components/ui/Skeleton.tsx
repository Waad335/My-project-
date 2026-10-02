import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, type DimensionValue, type ViewStyle } from "react-native";
import { colors, radii } from "@/theme";

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

// The web preview has no native animation driver.
const useNativeDriver = Platform.OS !== "web";

// A placeholder block shown while content loads. It pulses gently, and
// stays still when the device's "reduce motion" setting is on.
export function Skeleton({ width = "100%", height = 16, radius = radii.sm, style }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.6));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => mounted && setReduceMotion(enabled))
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.skeleton, opacity }, style]}
    />
  );
}
