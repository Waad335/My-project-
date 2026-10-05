import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import type { ShowcaseItem } from "@shared/api-types";
import { localized } from "@/catalog/product-logic";
import { ProductImage } from "@/components/catalog/ProductImage";
import { useLocale } from "@/i18n/I18nProvider";
import { palette, shadows } from "@/theme";

const MAT = 5;

// The website's ArchFrame: a showcase photo shown like a gallery piece,
// arch-topped, with an ivory mat, a hairline gold edge and a soft shadow.
// It opens the product or category it shows.
export function ArchFrame({ item, width, height, style }: { item: ShowcaseItem; width: number; height: number; style?: StyleProp<ViewStyle> }) {
  const locale = useLocale();
  const router = useRouter();
  const name = localized(locale, item.nameEn, item.nameAr);
  const open = () =>
    item.kind === "product"
      ? router.push({ pathname: "/product/[slug]", params: { slug: item.slug } })
      : router.push({ pathname: "/category/[slug]", params: { slug: item.slug } });
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={name}
      onPress={open}
      style={({ pressed }) => [
        styles.frame,
        { width, height, borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2 },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={[styles.photo, { borderTopLeftRadius: width / 2 - MAT, borderTopRightRadius: width / 2 - MAT }]}>
        <ProductImage uri={item.image} recyclingKey={item.id} style={StyleSheet.absoluteFill} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    padding: MAT,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: palette.ivory[50],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(199, 154, 94, 0.4)",
    ...shadows.softLg,
  },
  photo: { flex: 1, overflow: "hidden", borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: palette.sand[100] },
  pressed: { opacity: 0.9 },
});
