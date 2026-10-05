import { StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { ShowcaseItem } from "@shared/api-types";
import { palette } from "@/theme";
import { ArchFrame } from "./ArchFrame";

// Where the three arches stand, as on the website's phone layout
// (src/components/boutique/static-stage.tsx): a tall one in the middle, a
// smaller one at the start and a raised one at the end. Fractions of the
// stage; the layout mirrors in Arabic.
const SLOTS = [
  { width: 0.46, aspect: 4.4 / 3, bottom: 0.16, centre: true },
  { width: 0.31, aspect: 4.3 / 3, bottom: 0.17, start: 0.05 },
  { width: 0.29, aspect: 4.3 / 3, bottom: 0.36, end: 0.04 },
] as const;

// The website's hero stage: the first three showcase photos (real product
// photos, topped up with the store's category photography) on a blush arch
// and a plinth. Nothing is shown while there are no photos.
export function HeroStage({ items, width }: { items: ShowcaseItem[]; width: number }) {
  const { height: screenHeight } = useWindowDimensions();
  const pieces = items.slice(0, SLOTS.length);
  if (pieces.length === 0) return null;
  // h-[min(56svh,450px)] min-h-[330px]
  const height = Math.round(Math.max(330, Math.min(screenHeight * 0.56, 450)));

  const frames = pieces.map((item, i) => {
    const slot = SLOTS[i]!;
    const w = Math.round(width * slot.width);
    const h = Math.round(w * slot.aspect);
    const place =
      "centre" in slot
        ? { start: Math.round((width - w) / 2), zIndex: 2 }
        : "start" in slot
          ? { start: Math.round(width * slot.start), zIndex: 1 }
          : { end: Math.round(width * slot.end), zIndex: 1 };
    return <ArchFrame key={item.id} item={item} width={w} height={h} style={[styles.absolute, { bottom: Math.round(height * slot.bottom) }, place]} />;
  });

  return (
    <View style={{ width, height }}>
      {/* A blush plaster arch with a hairline gold echo. */}
      <View style={[styles.absolute, styles.backdrop, { width: width * 0.74, height: height * 0.74, start: width * 0.13, bottom: height * 0.14, borderTopLeftRadius: width * 0.37, borderTopRightRadius: width * 0.37 }]}>
        <LinearGradient colors={["rgba(245, 222, 220, 0.8)", "rgba(247, 240, 232, 0.7)", "rgba(247, 240, 232, 0)"]} style={StyleSheet.absoluteFill} />
      </View>
      <View
        pointerEvents="none"
        style={[styles.absolute, styles.echo, { width: width * 0.74 + 24, height: height * 0.74 + 12, start: width * 0.13 - 12, bottom: height * 0.14, borderTopLeftRadius: width * 0.37 + 12, borderTopRightRadius: width * 0.37 + 12 }]}
      />
      {/* The plinth. */}
      <View style={[styles.absolute, styles.plinth, { width: width * 0.84, height: height * 0.13, start: width * 0.08, bottom: height * 0.07, borderRadius: width * 0.42 }]}>
        <LinearGradient colors={[palette.ivory[50], palette.sand[200], palette.sand[300]]} style={StyleSheet.absoluteFill} />
        <View style={[styles.plinthTop, { borderRadius: width * 0.42 }]} />
      </View>
      {/* Sides first, so the middle arch stands in front. */}
      {frames.slice(1)}
      {frames[0]}
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: "absolute" },
  backdrop: { overflow: "hidden" },
  echo: { borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0, borderColor: "rgba(199, 154, 94, 0.25)" },
  plinth: { overflow: "hidden" },
  plinthTop: {
    position: "absolute",
    top: 0,
    start: 0,
    end: 0,
    height: "46%",
    backgroundColor: palette.ivory[100],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(199, 154, 94, 0.45)",
  },
});
