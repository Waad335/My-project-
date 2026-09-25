import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PRIVACY } from "@/content/legal";
import { LegalPage } from "@/components/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const doc = PRIVACY[locale === "ar" ? "ar" : "en"];
  return {
    title: doc.title,
    description: "How DODANA collects, uses and protects your personal information.",
    alternates: { canonical: "/privacy" },
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = await getTranslations("common");
  return <LegalPage doc={PRIVACY[locale === "ar" ? "ar" : "en"]} locale={locale} updatedLabel={t("lastUpdated")} />;
}
