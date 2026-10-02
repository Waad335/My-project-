import { StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { ArrowRight, ChevronRight, Heart, ShoppingBag } from "@/components/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "use-intl";
import { api, apiConfig, ApiError } from "@/api";
import { useSessionStore } from "@/auth/session-store";
import {
  AppText,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Icon,
  PriceTag,
  Screen,
  Skeleton,
  Wordmark,
} from "@/components/ui";
import { useLocale } from "@/i18n/I18nProvider";
import { colors, palette, radii, spacing, type TextVariant } from "@/theme";

// Developer-only preview of the design system, plus a live check that the
// app can reach the API it is configured for. Release builds redirect home.
// Section labels are English-only on purpose; sample text uses the app's
// real translations so both languages can be checked.

const VARIANTS: TextVariant[] = ["display", "title", "heading", "subheading", "body", "bodyStrong", "caption", "label"];
const SCALES = ["ivory", "sand", "champagne", "blush", "mocha", "gold"] as const;

export default function DesignSystemScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <DesignSystem />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <AppText variant="label" color="textMuted">
        {title.toUpperCase()}
      </AppText>
      {children}
    </Card>
  );
}

function DesignSystem() {
  const t = useTranslations();
  const locale = useLocale();
  const session = useSessionStore((s) => s.status);
  const settings = useQuery({ queryKey: ["dev", "settings"], queryFn: api.getSettings, retry: false });

  return (
    <Screen edges={["bottom"]}>
      <Section title="API connection">
        <AppText variant="caption" color="textMuted">
          {apiConfig.ok ? `Server: ${apiConfig.baseUrl}` : `Not configured: ${apiConfig.reason}`}
        </AppText>
        {settings.isPending ? (
          <Skeleton height={18} width="60%" />
        ) : settings.isError ? (
          <AppText variant="bodyStrong" color="danger">
            {settings.error instanceof ApiError ? `Failed (${settings.error.code})` : "Failed"}
          </AppText>
        ) : (
          <AppText variant="bodyStrong" color="highlightText">
            {`Connected · payment methods: ${settings.data.paymentMethods.join(", ") || "none"}`}
          </AppText>
        )}
        <AppText variant="caption" color="textMuted">{`Session: ${session}`}</AppText>
      </Section>

      <Section title="Brand">
        <Wordmark />
        <AppText variant="body" color="textMuted">
          {locale === "ar" ? t("brand.taglineAr") : t("brand.tagline")}
        </AppText>
      </Section>

      <Section title="Typography">
        {VARIANTS.map((variant) => (
          <AppText key={variant} variant={variant}>
            {`${variant} · ${t("nav.newArrivals")}`}
          </AppText>
        ))}
      </Section>

      <Section title="Colours">
        {SCALES.map((scale) => (
          <View key={scale} style={styles.swatchRow}>
            {Object.entries(palette[scale])
              .filter(([shade]) => shade !== "DEFAULT")
              .map(([shade, hex]) => (
                <View key={shade} style={[styles.swatch, { backgroundColor: hex }]} accessibilityLabel={`${scale} ${shade}`} />
              ))}
          </View>
        ))}
      </Section>

      <Section title="Buttons">
        <Button label={t("nav.shopAll")} />
        <Button label={t("common.viewAll")} variant="secondary" />
        <Button label={t("common.add")} variant="accent" icon={<Icon icon={ShoppingBag} size={18} color="accentStrong" />} />
        <Button label={t("common.learnMore")} variant="ghost" />
        <Button label={t("common.save")} loading />
        <Button label={t("common.save")} disabled fullWidth />
      </Section>

      <Section title="Prices (sample numbers)">
        <PriceTag price={1250} />
        <PriceTag price={1250} oldPrice={1500} />
        <PriceTag price={899.5} oldPrice={999} size="lg" />
      </Section>

      <Section title="Icons (arrows mirror in Arabic)">
        <View style={styles.iconRow}>
          <Icon icon={Heart} color="accentStrong" />
          <Icon icon={ChevronRight} directional />
          <Icon icon={ArrowRight} directional />
        </View>
      </Section>

      <Section title="Loading">
        <Skeleton height={140} radius={radii.card} />
        <Skeleton width="70%" />
        <Skeleton width="40%" />
      </Section>

      <Section title="Empty and error states">
        <EmptyState icon={Heart} title={t("wishlist.empty")} body={t("wishlist.emptyBody")} />
        <Divider />
        <ErrorState error={new ApiError({ status: 0, code: "network" })} onRetry={() => settings.refetch()} />
      </Section>

      <View style={styles.footer}>
        <AppText variant="caption" color="textSubtle" center>
          Development build only
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  swatchRow: { flexDirection: "row", gap: spacing.xs },
  swatch: {
    flex: 1,
    height: 32,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconRow: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  footer: { paddingBottom: spacing.lg },
});
