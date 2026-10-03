import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { colors, spacing } from "@/theme";

type AuthShellProps = { eyebrow?: string; title: string; subtitle?: string; children: ReactNode };

// The sign-in, register and password screens: the website's auth layout for
// phones, with the form kept above the keyboard.
export function AuthShell({ eyebrow, title, subtitle, children }: AuthShellProps) {
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          {eyebrow ? (
            <AppText variant="label" color="highlightText" style={locale === "en" && styles.upper}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="body" color="textMuted">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={styles.form}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// After signing in, go back to where the customer came from (the Account
// tab, the cart…), or to the Account tab when opened from a link.
export function leaveAuthFlow(router: { canGoBack: () => boolean; back: () => void; replace: (href: "/account") => void }) {
  if (router.canGoBack()) router.back();
  else router.replace("/account");
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.xl },
  heading: { gap: spacing.sm },
  upper: { textTransform: "uppercase", letterSpacing: 1.6 },
  form: { gap: spacing.lg },
});
