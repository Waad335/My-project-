import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { api } from "@/api";
import { useFieldErrorText, useFormFailure } from "@/auth/form-errors";
import { hasErrors, normalizeEmail, validateForgotPassword, type FieldErrors } from "@/auth/validation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AppText, Button, FormMessage, TextField } from "@/components/ui";

// "Forgot your password?": the server emails the website's reset link (the
// same email as the website's form); choosing the new password happens on
// the website's reset page, as agreed for v1.
export default function ForgotPasswordScreen() {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const failure = useFormFailure();
  const fieldText = useFieldErrorText();

  async function submit() {
    if (submitting) return;
    const local = validateForgotPassword({ email });
    setErrors(local);
    setMessage(null);
    if (hasErrors(local)) return;
    setSubmitting(true);
    try {
      const response = await api.forgotPassword(normalizeEmail(email));
      setSent(response.message || t("account.messages.resetEmailSent"));
    } catch (error) {
      const result = failure(error);
      setErrors(result.fieldErrors);
      setMessage(result.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: t("account.forgotTitle") }} />
      <AuthShell eyebrow={t("account.passwordEyebrow")} title={t("account.forgotTitle")} subtitle={t("account.forgotSubtitle")}>
        {sent ? <FormMessage tone="success" message={sent} /> : null}
        {message ? <FormMessage tone="error" message={message} /> : null}
        {!sent ? (
          <>
            <TextField
              label={t("account.email")}
              value={email}
              onChangeText={setEmail}
              error={fieldText(errors.email)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={submit}
              editable={!submitting}
            />
            <Button label={submitting ? t("account.sending") : t("account.sendResetLink")} loading={submitting} onPress={submit} fullWidth />
          </>
        ) : null}
        <Pressable accessibilityRole="link" onPress={() => router.back()} hitSlop={8} style={styles.back}>
          <AppText variant="bodyStrong" center style={styles.underline}>
            {t("account.backToSignIn")}
          </AppText>
        </Pressable>
      </AuthShell>
    </>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: "center" },
  underline: { textDecorationLine: "underline" },
});
