import { ShoppingBag } from "@/components/icons";
import { useTranslations } from "use-intl";
import { ComingSoon } from "@/components/ComingSoon";
import { AppText, Screen } from "@/components/ui";

// Cart. Phase 4 adds the cart; Phase 6 adds checkout.
export default function CartScreen() {
  const t = useTranslations("nav");
  return (
    <Screen>
      <AppText variant="title">{t("cart")}</AppText>
      <ComingSoon icon={ShoppingBag} />
    </Screen>
  );
}
