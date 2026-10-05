import { InputAccessoryView, Platform, Pressable, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { colors, spacing } from "@/theme";
import { AppText } from "./AppText";

// The iPhone number pad has no return key, so a field that uses it gets this
// bar above the keyboard with a "Next" button (link it with the field's
// inputAccessoryViewID). Android's number keyboard has its own Next key.
export function KeyboardNextBar({ nativeID, onNext }: { nativeID: string; onNext: () => void }) {
  const t = useTranslations("app.form");
  if (Platform.OS !== "ios") return null;
  return (
    <InputAccessoryView nativeID={nativeID} backgroundColor={colors.surfaceMuted}>
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" onPress={onNext} hitSlop={8} style={styles.button}>
          <AppText variant="bodyStrong" color="accentStrong">
            {t("next")}
          </AppText>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  button: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
});
