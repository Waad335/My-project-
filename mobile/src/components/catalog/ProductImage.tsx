import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image, type ImageContentFit } from "expo-image";
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

// Product and category photos (cached on the device). Missing or broken
// images show the DODANA wordmark on sand, like the website's DodanaImage.
export function ProductImage({ uri, style, contentFit = "cover", accessibilityLabel, recyclingKey, priority }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !uri || failed;
  return (
    <View style={[styles.frame, style]} accessible={Boolean(accessibilityLabel)} accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityLabel ? "image" : undefined}>
      {showFallback ? (
        <View style={styles.fallback}>
          <AppText style={[wordmarkStyle, styles.fallbackMark]} accessible={false}>
            DODANA
          </AppText>
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={recyclingKey}
          priority={priority}
          onError={() => setFailed(true)}
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
