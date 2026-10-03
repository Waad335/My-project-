import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, ChevronRight, LogOut, Palette } from "@/components/icons";
import { useTranslations } from "use-intl";
import { useSessionStore } from "@/auth/session-store";
import { AppText, Button, Card, Divider, FormMessage, Icon, Screen } from "@/components/ui";
import { signOutCustomer } from "@/shopping/account-sync";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { applyLayoutDirection } from "@/i18n/direction";
import { useLocale } from "@/i18n/I18nProvider";
import { useLocaleStore } from "@/i18n/locale-store";
import { colors, minTouchTarget, radii, spacing } from "@/theme";

// Account: signing in, creating an account and signing out, and the
// language choice.
export default function AccountScreen() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [switching, setSwitching] = useState(false);

  async function choose(next: Locale) {
    if (next === locale || switching) return;
    setSwitching(true);
    await setLocale(next);
    // On phones this restarts the app once to flip the layout direction.
    const restarting = await applyLayoutDirection(next);
    if (!restarting) setSwitching(false);
  }

  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        {t("nav.account")}
      </AppText>

      <AccountCard />

      <Card>
        <AppText variant="subheading">{t("common.language")}</AppText>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {locales.map((option, index) => {
            const selected = option === locale;
            return (
              <View key={option}>
                {index > 0 && <Divider />}
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: switching }}
                  accessibilityLanguage={option}
                  disabled={switching}
                  onPress={() => choose(option)}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                >
                  <AppText variant="body" fontLocale={option}>
                    {localeNames[option]}
                  </AppText>
                  {selected ? <Icon icon={Check} size={20} color="accentStrong" /> : null}
                </Pressable>
              </View>
            );
          })}
        </View>
        <AppText variant="caption" color="textMuted">
          {t("app.language.restartNote")}
        </AppText>
      </Card>

      {__DEV__ ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/dev/design-system")}
          style={({ pressed }) => [styles.devLink, pressed && styles.pressed]}
        >
          <Icon icon={Palette} size={20} color="textMuted" />
          <AppText variant="caption" color="textMuted" style={styles.devLabel}>
            Developer: design system & API check
          </AppText>
          <Icon icon={ChevronRight} size={18} color="textMuted" directional />
        </Pressable>
      ) : null}
    </Screen>
  );
}

// Signed out: sign in or create an account. Signed in: who, and sign out.
function AccountCard() {
  const t = useTranslations();
  const router = useRouter();
  const status = useSessionStore((s) => s.status);
  const customer = useSessionStore((s) => s.customer);
  const verified = useSessionStore((s) => s.verified);
  const ended = useSessionStore((s) => s.ended);
  const [signingOut, setSigningOut] = useState(false);
  const [keptOnPhone, setKeptOnPhone] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    const result = await signOutCustomer();
    setKeptOnPhone(result.keptOnPhone);
    setSigningOut(false);
  }

  if (status === "unknown") {
    return (
      <Card>
        <ActivityIndicator color={colors.textMuted} accessibilityLabel={t("common.loading")} />
      </Card>
    );
  }

  if (status === "signedIn") {
    return (
      <Card>
        <AppText variant="heading">{customer ? t("account.hello", { name: customer.name }) : t("account.myAccount")}</AppText>
        {customer ? (
          <AppText variant="body" color="textMuted">
            {customer.email}
          </AppText>
        ) : null}
        {!verified ? <FormMessage tone="info" message={t("app.auth.offline")} /> : null}
        <Button
          label={signingOut ? t("account.signingOut") : t("account.signOut")}
          variant="secondary"
          loading={signingOut}
          onPress={signOut}
          icon={<Icon icon={LogOut} size={18} />}
          fullWidth
        />
      </Card>
    );
  }

  return (
    <Card>
      {keptOnPhone ? (
        <FormMessage tone="info" message={t("app.auth.keptOnPhone")} />
      ) : ended === "expired" ? (
        <FormMessage tone="info" message={t("app.auth.sessionExpired")} />
      ) : ended === "signedOut" ? (
        <FormMessage tone="success" message={t("app.auth.signedOut")} />
      ) : null}
      <AppText variant="heading">{t("account.signInTitle")}</AppText>
      <AppText variant="body" color="textMuted">
        {t("account.signInSubtitle")}
      </AppText>
      <Button label={t("account.signIn")} onPress={() => router.push("/auth/sign-in")} fullWidth />
      <Button label={t("account.createAccount")} variant="secondary" onPress={() => router.push("/auth/register")} fullWidth />
    </Card>
  );
}

const styles = StyleSheet.create({
  options: { borderRadius: radii.md },
  option: {
    minHeight: minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.6 },
  devLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  devLabel: { flex: 1 },
});
