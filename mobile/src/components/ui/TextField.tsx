import { forwardRef } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, radii, spacing, textStyle } from "@/theme";
import { useLocale } from "@/i18n/I18nProvider";
import { AppText } from "./AppText";

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
  // Red outline without a message (when one message covers several fields).
  invalid?: boolean;
};

// A labelled text input in the app's type and colours.
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField({ label, error, invalid, style, ...rest }, ref) {
  const locale = useLocale();
  const body = textStyle("body", locale);
  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="label" color="textMuted">
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        aria-invalid={Boolean(error || invalid) || undefined}
        placeholderTextColor={colors.textSubtle}
        selectionColor={colors.accentStrong}
        {...rest}
        style={[styles.input, { fontFamily: body.fontFamily, fontSize: body.fontSize }, (error || invalid) && styles.inputError, style]}
      />
      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs + 2, flex: 1 },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
});
