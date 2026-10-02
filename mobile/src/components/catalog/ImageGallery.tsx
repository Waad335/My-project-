import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions, type ViewToken } from "react-native";
import { useTranslations } from "use-intl";
import { Expand } from "@/components/icons";
import { AppText, Icon } from "@/components/ui";
import { colors, radii, spacing } from "@/theme";
import { ProductImage } from "./ProductImage";

export type GalleryImage = { url: string; alt: string };

type ImageGalleryProps = {
  images: GalleryImage[];
  // Opens the full-screen viewer at this photo.
  onOpen: (index: number) => void;
};

const MAX_DOTS = 8;
const VIEWABILITY = { itemVisiblePercentThreshold: 60 };

// The product photos, full width: swipe between them, tap one to open the
// zoomable viewer. Shows "2 of 5" and dots for the current photo.
export function ImageGallery({ images, onOpen }: ImageGalleryProps) {
  const t = useTranslations();
  const { width, height: screenHeight } = useWindowDimensions();
  const height = Math.round(Math.min(width * 1.25, screenHeight * 0.62));
  const [index, setIndex] = useState(0);

  // Viewability (not scroll offsets) tracks the current photo, so it is
  // right in both reading directions.
  // (FlatList requires this callback to stay the same between renders.)
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<GalleryImage>[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  }, []);

  if (images.length === 0) {
    return <ProductImage uri={null} style={{ width, height }} />;
  }

  return (
    <View accessibilityLabel={t("product.gallery")}>
      <FlatList
        horizontal
        pagingEnabled
        data={images}
        keyExtractor={(image, i) => `${i}-${image.url}`}
        renderItem={({ item, index: i }) => (
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel={item.alt}
            accessibilityHint={t("viewer.openViewer")}
            onPress={() => onOpen(i)}
            style={{ width, height }}
          >
            <ProductImage uri={item.url} style={{ width, height }} priority={i === 0 ? "high" : "normal"} />
          </Pressable>
        )}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        initialNumToRender={1}
        windowSize={3}
      />
      <View style={styles.overlay}>
        {images.length > 1 && images.length <= MAX_DOTS ? (
          <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {images.map((image, i) => (
              <View key={`${i}-${image.url}`} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.topEnd}>
        {images.length > 1 ? (
          <View style={styles.pill}>
            <AppText variant="caption" color="text" style={styles.pillText}>
              {t("app.gallery.position", { index: index + 1, total: images.length })}
            </AppText>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("viewer.openViewer")}
          onPress={() => onOpen(index)}
          hitSlop={8}
          style={({ pressed }) => [styles.expand, pressed && styles.expandPressed]}
        >
          <Icon icon={Expand} size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", start: 0, end: 0, bottom: spacing.md, alignItems: "center", pointerEvents: "box-none" },
  dots: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(251, 245, 239, 0.7)",
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(58, 38, 32, 0.25)" },
  dotActive: { backgroundColor: colors.primary, width: 16 },
  topEnd: {
    position: "absolute",
    pointerEvents: "box-none",
    top: spacing.md,
    end: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: "rgba(251, 245, 239, 0.85)",
  },
  pillText: { fontSize: 12 },
  expand: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251, 245, 239, 0.85)",
  },
  expandPressed: { backgroundColor: colors.surface },
});
