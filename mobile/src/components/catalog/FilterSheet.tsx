import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  BROWSE_SORTS,
  isValidPriceRange,
  parsePrice,
  sanitizePriceInput,
  type BrowseFilters,
  type BrowseSort,
} from "@/catalog/filters";
import { AppText, BottomSheet, Button, Chip, TextField } from "@/components/ui";
import { spacing } from "@/theme";

type FilterSheetProps = {
  visible: boolean;
  filters: BrowseFilters;
  defaultSort: BrowseSort;
  onApply: (filters: BrowseFilters) => void;
  onClose: () => void;
};

// Sort and price range in one bottom sheet. Changes are a draft until
// "Show results"; closing the sheet discards them. Remount it (key) each
// time it opens so the draft starts from the applied filters.
export function FilterSheet({ visible, filters, defaultSort, onApply, onClose }: FilterSheetProps) {
  const t = useTranslations();
  const [sort, setSort] = useState<BrowseSort>(filters.sort);
  const [min, setMin] = useState(filters.minPrice?.toString() ?? "");
  const [max, setMax] = useState(filters.maxPrice?.toString() ?? "");
  const [showError, setShowError] = useState(false);

  const minPrice = parsePrice(min);
  const maxPrice = parsePrice(max);
  const rangeValid = isValidPriceRange(minPrice, maxPrice);

  function apply() {
    if (!rangeValid) {
      setShowError(true);
      return;
    }
    onApply({ sort, minPrice, maxPrice });
  }

  function reset() {
    setSort(defaultSort);
    setMin("");
    setMax("");
    setShowError(false);
  }

  return (
    <BottomSheet
      visible={visible}
      title={t("common.filter")}
      closeLabel={t("app.close")}
      onClose={onClose}
      footer={
        <>
          <Button label={t("shop.clearFilters")} variant="secondary" onPress={reset} style={styles.footerButton} />
          <Button label={t("app.filters.apply")} onPress={apply} style={styles.footerButton} />
        </>
      }
    >
      <View style={styles.section}>
        <AppText variant="label" color="textMuted">
          {t("common.sort")}
        </AppText>
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={t("shop.sortLabel")}>
          {BROWSE_SORTS.map((value) => (
            <Chip key={value} role="radio" label={t(`shop.sort.${value}`)} selected={sort === value} onPress={() => setSort(value)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="label" color="textMuted">
          {t("app.filters.price")}
        </AppText>
        <View style={styles.priceRow}>
          <TextField
            label={t("app.filters.min")}
            value={min}
            onChangeText={(text) => {
              setMin(sanitizePriceInput(text));
              setShowError(false);
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="0"
            invalid={showError && !rangeValid}
          />
          <TextField
            label={t("app.filters.max")}
            value={max}
            onChangeText={(text) => {
              setMax(sanitizePriceInput(text));
              setShowError(false);
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="—"
            invalid={showError && !rangeValid}
          />
        </View>
        {showError && !rangeValid ? (
          <AppText variant="caption" color="danger" accessibilityRole="alert">
            {t("app.filters.invalidRange")}
          </AppText>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  priceRow: { flexDirection: "row", gap: spacing.md },
  footerButton: { flex: 1, alignSelf: "stretch", paddingHorizontal: spacing.md },
});
