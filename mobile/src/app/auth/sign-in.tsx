import { useRef, useState } from "react";
import { Pressable, StyleSheet, View, type TextInput } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { api } from "@/api";
import { useFieldErrorText, useFormFailure } from "@/auth/form-errors";
import { useSessionStore } from "@/auth/session-store";
import { hasErrors, normalizeEmail, validateSignIn, type FieldErrors } from "@/auth/validation";
import { AuthShell, leaveAuthFlow } from "@/components/auth/AuthShell";
import { AppText, Button, FormMessage, PasswordField, TextField } from "@/components/ui";
import { spacing } from "@/theme";

// Sign in with the website account's email and password (the same accounts
// as the website). The token goes to the Keychain/Keystore; the cart and
// wishlist on the phone are then merged into the account.
export default function SignInScreen() {
  const t = useTranslations();
  const router = useRouter();
  const signIn = useSessionStore((s) => s.signIn);
  const expired = useSessionStore((s) => s.ended === "expired");
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const failure = useFormFailure();
  const fieldText = useFieldErrorText();

  async function submit() {
    if (submitting) return;
    const local = validateSignIn({ email, password });
    setErrors(local);
    setMessage(null);
    if (hasErrors(local)) return;
    setSubmitting(true);
    try {
      const session = await api.login({ email: normalizeEmail(email), password });
      await signIn(session);
      leaveAuthFlow(router);
    } catch (error) {
      const result = failure(error);
      setErrors(result.fieldErrors);
      setMessage(result.message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: t("account.signIn") }} />
      <AuthShell eyebrow={t("account.welcomeBack")} title={t("account.signInTitle")} subtitle={t("account.signInSubtitle")}>
        {expired && !message ? <FormMessage tone="info" message={t("app.auth.sessionExpired")} /> : null}
        {message ? <FormMessage tone="error" message={message} /> : null}
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
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!submitting}
        />
        <PasswordField
          ref={passwordRef}
          label={t("account.password")}
          value={password}
          onChangeText={setPassword}
          error={fieldText(errors.password)}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!submitting}
        />
        <Pressable accessibilityRole="link" onPress={() => router.push("/auth/forgot-password")} hitSlop={8} style={styles.forgot}>
          <AppText variant="caption" color="text" style={styles.underline}>
            {t("account.forgotLink")}
          </AppText>
        </Pressable>
        <Button label={submitting ? t("account.signingIn") : t("account.signIn")} loading={submitting} onPress={submit} fullWidth />
        <AppText variant="caption" color="textMuted" center>
          {t("app.auth.syncNote")}
        </AppText>
        <View style={styles.switchRow}>
          <AppText variant="body" color="textMuted">
            {t("account.noAccount")}
          </AppText>
          <Pressable accessibilityRole="link" onPress={() => router.replace("/auth/register")} hitSlop={8}>
            <AppText variant="bodyStrong" style={styles.underline}>
              {t("account.createAccount")}
            </AppText>
          </Pressable>
        </View>
      </AuthShell>
    </>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: "flex-end", marginTop: -spacing.sm },
  underline: { textDecorationLine: "underline" },
  switchRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: spacing.xs },
});
