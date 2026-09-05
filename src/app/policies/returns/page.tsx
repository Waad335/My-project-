import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getSiteSettings } from "@/lib/settings";
import { SparkleDivider } from "@/components/icons/decorative";

export const metadata: Metadata = { title: "Returns Policy" };

export default async function ReturnsPolicyPage() {
  const t = await getTranslations("footer");
  const locale = await getLocale();
  const settings = await getSiteSettings();
  const policy = locale === "ar" ? settings.returnsPolicyAr : settings.returnsPolicyEn;

  return (
    <div className="container-dodana py-12">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl text-mocha-700">{t("returns")}</h1>
        <SparkleDivider className="mt-4" />
      </div>
      <div className="card-surface mx-auto max-w-2xl whitespace-pre-line p-6 text-sm leading-relaxed text-mocha-600">
        {policy}
      </div>
    </div>
  );
}
