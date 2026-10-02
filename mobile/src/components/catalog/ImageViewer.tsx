import { useState } from "react";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";
import { ChevronLeft, ChevronRight, X } from "@/components/icons";
import { AppText, Icon } from "@/components/ui";
import { useIsRtl } from "@/i18n/I18nProvider";
import { colors, minTouchTarget, radii, spacing } from "@/theme";
import type { GalleryImage } from "./ImageGallery";
import { ProductImage } from "./ProductImage";

type ImageViewerProps = {
  images: GalleryImage[];
  visible: boolean;
  initialIndex: number;
  onClose: () => void;
};

// Full-screen photos, like the website's image viewer: pinch or double-tap
// to zoom, drag to look around, swipe (or the arrows) for the next photo.
// Remount it (key) each time it opens so it starts at `initialIndex`.
export function ImageViewer({ images, visible, initialIndex, onClose }: ImageViewerProps) {
  const t = useTranslations();
  const isRtl = useIsRtl();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);
  const count = images.length;
  const image = images[Math.min(index, count - 1)];

  const go = (step: 1 | -1) => setIndex((i) => (i + step + count) % count);
  // A swipe towards the start of the line shows the next photo (leftwards
  // in English, rightwards in Arabic).
  const onSwipe = (direction: "left" | "right") => go((direction === "left") !== isRtl ? 1 : -1);

  const stageHeight = Math.round(height * 0.72);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent supportedOrientations={["portrait"]}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.root} edges={["top", "bottom"]} accessibilityViewIsModal aria-label={t("viewer.imageViewer")}>
          <View style={styles.header}>
            <AppText variant="caption" color="textMuted" accessibilityLiveRegion="polite">
              {count > 1 ? t("app.gallery.position", { index: index + 1, total: count }) : ""}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("viewer.closeViewer")}
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
            >
              <Icon icon={X} size={22} />
            </Pressable>
          </View>

          <View style={styles.stage}>
            {image ? (
              <ZoomableImage
                key={`${index}-${image.url}`}
                uri={image.url}
                label={image.alt}
                width={width}
                height={stageHeight}
                onSwipe={count > 1 ? onSwipe : undefined}
              />
            ) : null}
          </View>

          <View style={styles.footer}>
            {count > 1 ? (
              <View style={styles.arrows}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("viewer.previousImage")}
                  onPress={() => go(-1)}
                  style={({ pressed }) => [styles.roundButton, styles.bordered, pressed && styles.pressed]}
                >
                  <Icon icon={ChevronLeft} size={22} directional />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("viewer.nextImage")}
                  onPress={() => go(1)}
                  style={({ pressed }) => [styles.roundButton, styles.bordered, pressed && styles.pressed]}
                >
                  <Icon icon={ChevronRight} size={22} directional />
                </Pressable>
              </View>
            ) : null}
            <AppText variant="caption" color="textMuted" center>
              {t("app.viewer.hint")}
            </AppText>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_DISTANCE = 60;

type ZoomableImageProps = {
  uri: string;
  label: string;
  width: number;
  height: number;
  onSwipe?: (direction: "left" | "right") => void;
};

// One photo that can be pinched, double-tapped and dragged. Gestures run on
// the UI thread, so zooming stays smooth.
function ZoomableImage({ uri, label, width, height, onSwipe }: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  // Keep the zoomed photo covering the stage: never drag past its edges.
  const settle = (nextScale: number, nextX: number, nextY: number) => {
    "worklet";
    const maxX = (width * (nextScale - 1)) / 2;
    const maxY = (height * (nextScale - 1)) / 2;
    const clampedX = Math.min(Math.max(nextX, -maxX), maxX);
    const clampedY = Math.min(Math.max(nextY, -maxY), maxY);
    scale.value = withTiming(nextScale);
    x.value = withTiming(clampedX);
    y.value = withTiming(clampedY);
    savedScale.value = nextScale;
    savedX.value = clampedX;
    savedY.value = clampedY;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), MAX_SCALE);
    })
    .onEnd(() => {
      settle(scale.value, x.value, y.value);
    });

  const pan = Gesture.Pan()
    .maxPointers(1)
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        x.value = savedX.value + e.translationX;
        y.value = savedY.value + e.translationY;
      }
    })
    .onEnd((e, success) => {
      if (savedScale.value > 1) {
        settle(savedScale.value, x.value, y.value);
        return;
      }
      if (!success || !onSwipe) return;
      if (Math.abs(e.translationX) > SWIPE_DISTANCE && Math.abs(e.translationX) > Math.abs(e.translationY) * 1.5) {
        scheduleOnRN(onSwipe, e.translationX < 0 ? "left" : "right");
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e, success) => {
      if (!success) return;
      if (savedScale.value > 1) {
        settle(1, 0, 0);
      } else {
        // Zoom in on the tapped spot.
        const factor = DOUBLE_TAP_SCALE - 1;
        settle(DOUBLE_TAP_SCALE, -(e.x - width / 2) * factor, -(e.y - height / 2) * factor);
      }
    });

  const gesture = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height }, animatedStyle]} collapsable={false}>
        <ProductImage uri={uri} contentFit="contain" accessibilityLabel={label} style={[styles.image, { width, height }]} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingStart: spacing.lg,
    paddingEnd: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stage: { flex: 1, justifyContent: "center", overflow: "hidden" },
  image: { backgroundColor: colors.background },
  footer: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, alignItems: "center" },
  arrows: { flexDirection: "row", gap: spacing.lg },
  roundButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  bordered: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  pressed: { backgroundColor: colors.surfaceMuted },
});
