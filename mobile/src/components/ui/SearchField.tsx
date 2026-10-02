import { forwardRef } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Search, X } from "@/components/icons";
import { colors, minTouchTarget, radii, spacing, textStyle } from "@/theme";
import { useLocale } from "@/i18n/I18nProvider";
import { Icon } from "./Icon";

type SearchFieldProps = Omit<TextInputProps, "onChangeText" | "value"> & {
  value: string;
  onChangeText: (text: string) => void;
  clearLabel: string;
};

// The search box: magnifier, text, and a clear button once there's text.
export const SearchField = forwardRef<TextInput, SearchFieldProps>(function SearchField(
  { value, onChangeText, clearLabel, style, ...rest },
  ref
) {
  const locale = useLocale();
  const body = textStyle("body", locale);
  return (
    <View style={styles.box}>
      <Icon icon={Search} size={18} color="textMuted" />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        enterKeyHint="search"
        placeholderTextColor={colors.textSubtle}
        selectionColor={colors.accentStrong}
        {...rest}
        style={[styles.input, { fontFamily: body.fontFamily, fontSize: body.fontSize }, style]}
      />
      {value.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel={clearLabel} onPress={() => onChangeText("")} hitSlop={8} style={styles.clear}>
          <Icon icon={X} size={16} color="textMuted" />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    minHeight: minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  // The pill itself is the visible field; no extra browser focus ring on the web.
  input: { flex: 1, minHeight: minTouchTarget, color: colors.text, paddingVertical: 0, ...(Platform.OS === "web" ? { outlineWidth: 0 } : null) },
  clear: { padding: spacing.xs },
});
