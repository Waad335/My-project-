import { FlatList, StyleSheet } from "react-native";
import type { ProductCard as ProductCardData } from "@shared/api-types";
import { spacing } from "@/theme";
import { ProductCard } from "./ProductCard";

export const RAIL_CARD_WIDTH = 168;

// A sideways-scrolling row of product cards (home sections, "You may also
// like"). In Arabic it scrolls from the right, like the rest of the layout.
export function ProductRail({ products }: { products: ProductCardData[] }) {
  return (
    <FlatList
      horizontal
      data={products}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <ProductCard product={item} width={RAIL_CARD_WIDTH} />}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.list}
      initialNumToRender={3}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  // Bleed to the screen edges while keeping the page's side padding.
  list: { marginHorizontal: -spacing.lg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
});
