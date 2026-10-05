import { useCallback, useState } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image, type ImageContentFit } from "expo-image";
import { SvgUri } from "react-native-svg";
import { mediaUrl } from "@/api/media";
import { colors, wordmarkStyle } from "@/theme";
import { AppText } from "@/components/ui";

type ProductImageProps = {
  uri: string | null;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  accessibilityLabel?: string;
  // Lets lists reuse image views safely while scrolling.
  recyclingKey?: string;
  priority?: "low" | "normal" | "high";
};

export const isSvgUrl = (url: string) => /\.svg(?:[?#]|$)/i.test(url);

// The website's product photos are SVG drawings for now (its "Sample image"
// placeholders). On iPhone, expo-image hands SVG files to Apple's CoreSVG,
// which fails on some of them (gradients, named fonts: both used here) and
// reports an error. So on iPhone they're drawn with react-native-svg, the
// library the app's icons already use. Everywhere else expo-image shows them.
const drawsSvgItself = () => Platform.OS === "ios";

// expo-image's contentFit as an SVG preserveAspectRatio.
const SVG_FIT: Record<ImageContentFit, string> = {
  cover: "xMidYMid slice",
  contain: "xMidYMid meet",
  fill: "none",
  none: "xMidYMid slice",
  "scale-down": "xMidYMid meet",
};

// Product and category photos (cached on the device), including the
// website's SVG placeholders. Missing or broken images show the DODANA
// wordmark on sand, like the website's DodanaImage.
export function ProductImage({ uri, style, contentFit = "cover", accessibilityLabel, recyclingKey, priority }: ProductImageProps) {
  const source = mediaUrl(uri);
  const [failed, setFailed] = useState<string | null>(null);
  // Stable, so the SVG isn't fetched again on every render.
  const onSvgError = useCallback(() => setFailed(source), [source]);
  // A new address gets a fresh try (e.g. after the list refreshes).
  const image = source && failed !== source ? source : null;
  return (
    <View style={[styles.frame, style]} accessible={Boolean(accessibilityLabel)} accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityLabel ? "image" : undefined}>
      {image === null ? (
        <View style={styles.fallback}>
          <AppText style={[wordmarkStyle, styles.fallbackMark]} accessible={false}>
            DODANA
          </AppText>
        </View>
      ) : drawsSvgItself() && isSvgUrl(image) ? (
        <SvgUri uri={image} width="100%" height="100%" preserveAspectRatio={SVG_FIT[contentFit]} style={StyleSheet.absoluteFill} onError={onSvgError} />
      ) : (
        <Image
          source={{ uri: image }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={recyclingKey}
          priority={priority}
          onError={() => setFailed(image)}
          accessible={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", backgroundColor: colors.surfaceMuted },
  fallback: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  fallbackMark: { fontSize: 14, color: colors.textSubtle },
});
