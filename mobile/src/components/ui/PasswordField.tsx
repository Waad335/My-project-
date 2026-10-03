import { forwardRef, useState } from "react";
import { Pressable, StyleSheet, type TextInput } from "react-native";
import { useTranslations } from "use-intl";
import { Eye, EyeOff } from "@/components/icons";
import { spacing } from "@/theme";
import { Icon } from "./Icon";
import { TextField } from "./TextField";

type PasswordFieldProps = Omit<Parameters<typeof TextField>[0], "secureTextEntry" | "trailing">;

// A password input with the website's "Show password" / "Hide password"
// toggle. Never autocorrected or capitalised.
export const PasswordField = forwardRef<TextInput, PasswordFieldProps>(function PasswordField(props, ref) {
  const t = useTranslations("account");
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      ref={ref}
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      {...props}
      secureTextEntry={!visible}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? t("hidePassword") : t("showPassword")}
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          style={styles.toggle}
        >
          <Icon icon={visible ? EyeOff : Eye} size={20} color="textMuted" />
        </Pressable>
      }
    />
  );
});

const styles = StyleSheet.create({
  toggle: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
