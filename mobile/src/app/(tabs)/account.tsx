import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, ChevronRight, Palette, User } from "@/components/icons";
import { useTranslations } from "use-intl";
import { ComingSoon } from "@/components/ComingSoon";
import { AppText, Card, Divider, Icon, Screen } from "@/components/ui";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { applyLayoutDirection } from "@/i18n/direction";
import { useLocale } from "@/i18n/I18nProvider";
import { useLocaleStore } from "@/i18n/locale-store";
import { colors, minTouchTarget, radii, spacing } from "@/theme";

// Account. Phase 5 adds sign-in, profile, orders and the full settings
// screen; for now it holds the language choice.
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
      <AppText variant="title">{t("nav.account")}</AppText>

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

      <ComingSoon icon={User} />

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
