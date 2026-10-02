import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import { SearchX } from "@/components/icons";
import { Button, EmptyState } from "@/components/ui";
import { spacing } from "@/theme";

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

// A product or category that doesn't exist (or is no longer sold).
export function NotFoundState() {
  const t = useTranslations("app.notFound");
  const router = useRouter();
  return (
    <View style={styles.center}>
      <EmptyState icon={SearchX} title={t("title")} />
      <Button label={t("home")} onPress={() => router.dismissTo("/")} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", gap: spacing.lg, paddingTop: spacing.xxxl },
  button: { alignSelf: "center" },
});
