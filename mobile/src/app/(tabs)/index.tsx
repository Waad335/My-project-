import { StyleSheet, View } from "react-native";
import { Sparkles } from "@/components/icons";
import { useTranslations } from "use-intl";
import { ComingSoon } from "@/components/ComingSoon";
import { AppText, Screen, Wordmark } from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { spacing } from "@/theme";

// Home. Phase 3 adds the showcase, the "Shop by category" cards, new
// arrivals and best sellers.
export default function HomeScreen() {
  const t = useTranslations("brand");
  const locale = useLocale();
  return (
    <Screen>
      <View style={styles.brand}>
        <Wordmark size={34} />
        <AppText variant="body" color="textMuted" center>
          {locale === "ar" ? t("taglineAr") : t("tagline")}
        </AppText>
      </View>
      <ComingSoon icon={Sparkles} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", gap: spacing.sm, paddingTop: spacing.lg },
});
