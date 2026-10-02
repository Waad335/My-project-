import { LayoutGrid } from "@/components/icons";
import { useTranslations } from "use-intl";
import { ComingSoon } from "@/components/ComingSoon";
import { AppText, Screen } from "@/components/ui";

// Shop. Phase 3 adds categories, search, filters and sorting.
export default function ShopScreen() {
  const t = useTranslations("nav");
  return (
    <Screen>
      <AppText variant="title">{t("shop")}</AppText>
      <ComingSoon icon={LayoutGrid} />
    </Screen>
  );
}
