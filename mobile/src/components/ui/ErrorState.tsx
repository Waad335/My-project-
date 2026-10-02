import { StyleSheet, View } from "react-native";
import { CloudOff } from "@/components/icons";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import { colors, radii, spacing } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Icon } from "./Icon";

// The message to show for a failed request: the server's own message
// (already in the customer's language) when there is one, otherwise the
// app's wording for "no connection", "too slow" or a generic error.
export function useErrorMessage(): (error: unknown) => string {
  const t = useTranslations();
  return (error) => {
    if (error instanceof ApiError) {
      if (error.serverMessage) return error.serverMessage;
      if (error.code === "network") return t("app.errors.network");
      if (error.code === "timeout") return t("app.errors.timeout");
      if (error.code === "config") return t("app.errors.config");
    }
    return t("common.error");
  };
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useTranslations("app");
  const messageFor = useErrorMessage();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.iconCircle}>
        <Icon icon={CloudOff} size={26} color="danger" />
      </View>
      <AppText variant="body" color="text" center>
        {messageFor(error)}
      </AppText>
      {onRetry ? <Button label={t("retry")} variant="secondary" onPress={onRetry} style={styles.retry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  retry: { alignSelf: "center" },
});
