import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  // Tab screens sit above the tab bar, which already handles the bottom edge.
  edges?: Edge[];
  contentStyle?: ViewStyle;
};

// The page wrapper: ivory background, safe areas (notch, home indicator) and
// consistent side padding.
export function Screen({ children, scroll = true, edges = ["top"], contentStyle }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, gap: spacing.xl },
  fill: { flex: 1 },
});
