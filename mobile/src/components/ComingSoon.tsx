import type { LucideIcon } from "lucide-react-native";
import { useTranslations } from "use-intl";
import { Card, EmptyState } from "@/components/ui";

// Placeholder for sections built in later phases.
export function ComingSoon({ icon }: { icon: LucideIcon }) {
  const t = useTranslations("app.comingSoon");
  return (
    <Card>
      <EmptyState icon={icon} title={t("title")} body={t("body")} />
    </Card>
  );
}
