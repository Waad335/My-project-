import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { TERMS } from "@/content/legal";
import { LegalPage } from "@/components/legal/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const doc = TERMS[locale === "ar" ? "ar" : "en"];
  return {
    title: doc.title,
    description: "The terms that apply when you shop with DODANA.",
    alternates: { canonical: "/terms" },
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const t = await getTranslations("common");
  return <LegalPage doc={TERMS[locale === "ar" ? "ar" : "en"]} locale={locale} updatedLabel={t("lastUpdated")} />;
}
