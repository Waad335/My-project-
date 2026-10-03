import { useRef, useState, type ReactNode } from "react";
import { Linking, Pressable, StyleSheet, View, type TextInput } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { api } from "@/api";
import { useFieldErrorText, useFormFailure } from "@/auth/form-errors";
import { useSessionStore } from "@/auth/session-store";
import { hasErrors, normalizeEmail, normalizePhone, validateRegister, type FieldErrors } from "@/auth/validation";
import { useSettings } from "@/catalog/queries";
import { AuthShell, leaveAuthFlow } from "@/components/auth/AuthShell";
import { AppText, Button, FormMessage, PasswordField, TextField } from "@/components/ui";
import { spacing } from "@/theme";

// Create a DODANA account (the same accounts as the website: name, email,
// optional Egyptian mobile number, password) and sign in.
export default function RegisterScreen() {
  const t = useTranslations();
  const router = useRouter();
  const signIn = useSessionStore((s) => s.signIn);
  const siteUrl = useSettings().data?.siteUrl ?? null;
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const failure = useFormFailure();
  const fieldText = useFieldErrorText();

  async function submit() {
    if (submitting) return;
    const local = validateRegister({ name, email, phone, password });
    setErrors(local);
    setMessage(null);
    if (hasErrors(local)) return;
    setSubmitting(true);
    try {
      const normalizedPhone = normalizePhone(phone);
      const session = await api.register({
        name: name.trim(),
        email: normalizeEmail(email),
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
        password,
      });
      await signIn(session);
      leaveAuthFlow(router);
    } catch (error) {
      const result = failure(error);
      setErrors(result.fieldErrors);
      setMessage(result.message);
      setSubmitting(false);
    }
  }

  const openPage = (path: "/terms" | "/privacy") => {
    if (siteUrl) void Linking.openURL(`${siteUrl.replace(/\/$/, "")}${path}`);
  };
  // The website's Terms and Privacy pages open in the browser.
  function renderLink(path: "/terms" | "/privacy", chunks: ReactNode) {
    if (!siteUrl) return chunks;
    return (
      <AppText key={path} variant="caption" color="text" accessibilityRole="link" onPress={() => openPage(path)} style={styles.underline}>
        {chunks}
      </AppText>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("account.createAccount") }} />
      <AuthShell eyebrow={t("account.joinEyebrow")} title={t("account.registerTitle")} subtitle={t("account.registerSubtitle")}>
        {message ? <FormMessage tone="error" message={message} /> : null}
        <TextField
          label={t("account.fullName")}
          value={name}
          onChangeText={setName}
          error={fieldText(errors.name)}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          editable={!submitting}
        />
        <TextField
          ref={emailRef}
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
          onSubmitEditing={() => phoneRef.current?.focus()}
          editable={!submitting}
        />
        <TextField
          ref={phoneRef}
          label={t("account.phone")}
          optionalLabel={t("account.optional")}
          hint={t("account.phoneHint")}
          value={phone}
          onChangeText={setPhone}
          error={fieldText(errors.phone)}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!submitting}
        />
        <PasswordField
          ref={passwordRef}
          label={t("account.password")}
          hint={t("account.passwordHint")}
          value={password}
          onChangeText={setPassword}
          error={fieldText(errors.password)}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!submitting}
        />
        <Button
          label={submitting ? t("account.creatingAccount") : t("account.createAccount")}
          loading={submitting}
          onPress={submit}
          fullWidth
        />
        <AppText variant="caption" color="textMuted" center>
          {t.rich("account.agree", { terms: (chunks) => renderLink("/terms", chunks), privacy: (chunks) => renderLink("/privacy", chunks) })}
        </AppText>
        <AppText variant="caption" color="textMuted" center>
          {t("app.auth.syncNote")}
        </AppText>
        <View style={styles.switchRow}>
          <AppText variant="body" color="textMuted">
            {t("account.haveAccount")}
          </AppText>
          <Pressable accessibilityRole="link" onPress={() => router.replace("/auth/sign-in")} hitSlop={8}>
            <AppText variant="bodyStrong" style={styles.underline}>
              {t("account.signIn")}
            </AppText>
          </Pressable>
        </View>
      </AuthShell>
    </>
  );
}

const styles = StyleSheet.create({
  underline: { textDecorationLine: "underline" },
  switchRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: spacing.xs },
});
