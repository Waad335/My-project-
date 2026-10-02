import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { SearchX } from "@/components/icons";
import { useTranslations } from "use-intl";
import { Button, EmptyState, Screen } from "@/components/ui";
import { spacing } from "@/theme";

export default function NotFoundScreen() {
  const t = useTranslations("app.notFound");
  const router = useRouter();
  return (
    <Screen edges={["top", "bottom"]}>
      <View style={styles.center}>
        <EmptyState icon={SearchX} title={t("title")} />
        <Button label={t("home")} onPress={() => router.replace("/")} style={styles.button} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", gap: spacing.lg, paddingTop: spacing.xxxl },
  button: { alignSelf: "center" },
});
