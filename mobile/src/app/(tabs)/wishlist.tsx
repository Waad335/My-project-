import { Heart } from "@/components/icons";
import { useTranslations } from "use-intl";
import { ComingSoon } from "@/components/ComingSoon";
import { AppText, Screen } from "@/components/ui";

// Wishlist. Phase 4 adds the saved pieces and syncing.
export default function WishlistScreen() {
  const t = useTranslations("nav");
  return (
    <Screen>
      <AppText variant="title">{t("wishlist")}</AppText>
      <ComingSoon icon={Heart} />
    </Screen>
  );
}
