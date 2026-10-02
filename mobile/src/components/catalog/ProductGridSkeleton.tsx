import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/components/ui";
import { radii, spacing } from "@/theme";

// Placeholder cards shown while products load.
export function ProductGridSkeleton({ cardWidth, count = 4 }: { cardWidth: number; count?: number }) {
  return (
    <View style={styles.grid} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: cardWidth, gap: spacing.sm }}>
          <Skeleton height={Math.round(cardWidth * 1.25)} radius={radii.card} />
          <Skeleton width="45%" height={10} />
          <Skeleton width="85%" height={14} />
          <Skeleton width="35%" height={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, rowGap: spacing.xl },
});
