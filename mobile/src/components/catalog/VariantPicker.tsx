import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ProductVariant } from "@shared/api-types";
import { splitVariants } from "@/catalog/product-logic";
import { AppText, Chip } from "@/components/ui";
import { spacing } from "@/theme";

type VariantPickerProps = {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (variantId: string) => void;
};

// Colour and size choices as on the website: one selected variant, colours
// with their swatch and the chosen colour's name next to the label.
export function VariantPicker({ variants, selectedId, onSelect }: VariantPickerProps) {
  const t = useTranslations("product");
  const { colors, sizes } = splitVariants(variants);
  const selected = variants.find((v) => v.id === selectedId) ?? null;

  return (
    <>
      {colors.length > 0 ? (
        <View style={styles.group}>
          <View style={styles.labelRow}>
            <AppText variant="label" color="text">
              {t("color")}
            </AppText>
            {selected?.color ? (
              <AppText variant="caption" color="textMuted">
                {selected.color}
              </AppText>
            ) : null}
          </View>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={t("color")}>
            {colors.map((v) => (
              <Chip
                key={v.id}
                role="radio"
                label={v.color ?? ""}
                selected={v.id === selectedId}
                onPress={() => onSelect(v.id)}
                leading={v.colorHex ? <View style={[styles.swatch, { backgroundColor: v.colorHex }]} /> : undefined}
              />
            ))}
          </View>
        </View>
      ) : null}
      {sizes.length > 0 ? (
        <View style={styles.group}>
          <AppText variant="label" color="text">
            {t("size")}
          </AppText>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={t("size")}>
            {sizes.map((v) => (
              <Chip key={v.id} role="radio" label={v.size ?? ""} selected={v.id === selectedId} onPress={() => onSelect(v.id)} />
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm + 2 },
  labelRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  swatch: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: "rgba(0, 0, 0, 0.1)" },
});
