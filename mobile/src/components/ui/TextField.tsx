import { forwardRef, type ReactNode } from "react";
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { colors, radii, spacing, textStyle } from "@/theme";
import { useLocale } from "@/i18n/I18nProvider";
import { AppText } from "./AppText";

type TextFieldProps = TextInputProps & {
  label?: string;
  // Shown under the label, e.g. "Egyptian mobile, e.g. 01012345678".
  hint?: string;
  // Shown after the label for fields that can be left empty.
  optionalLabel?: string;
  error?: string | null;
  // Red outline without a message (when one message covers several fields).
  invalid?: boolean;
  // A control inside the field, at its end (e.g. show/hide password).
  trailing?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

// A labelled text input in the app's type and colours.
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, optionalLabel, error, invalid, trailing, containerStyle, style, ...rest },
  ref
) {
  const locale = useLocale();
  const body = textStyle("body", locale);
  const flagged = Boolean(error || invalid);
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText variant="label" color="textMuted">
            {label}
          </AppText>
          {optionalLabel ? (
            <AppText variant="caption" color="textSubtle">
              {optionalLabel}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.box, flagged && styles.boxError]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={hint}
          aria-invalid={flagged || undefined}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.accentStrong}
          {...rest}
          style={[styles.input, { fontFamily: body.fontFamily, fontSize: body.fontSize }, style]}
        />
        {trailing}
      </View>
      {hint && !error ? (
        <AppText variant="caption" color="textMuted">
          {hint}
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs + 2 },
  labelRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  box: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxError: { borderColor: colors.danger },
  input: { flex: 1, minHeight: 46, paddingHorizontal: spacing.lg, color: colors.text },
});
