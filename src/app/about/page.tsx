import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { SparkleDivider, HeartIcon } from "@/components/icons/decorative";

export const metadata: Metadata = { title: "About DODANA" };

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getTranslations("hero");

  return (
    <div className="container-dodana py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="flex items-center justify-center gap-1.5 font-heading text-3xl text-mocha-700">
          DODANA <HeartIcon className="h-4 w-4 text-blush-400" />
        </span>
        <p className="mt-4 font-heading text-xl italic text-blush-400">{t("titleEn")}</p>
        <SparkleDivider className="my-6" />
        <p className="text-balance leading-relaxed text-mocha-600">
          {locale === "ar"
            ? "دودانا هي الصحبة اللي عندها ذوق، ولقيتلك الحاجات الحلوة قبل ما تدوري عليها. من العناية بالبشرة والشعر للعطور والإكسسوارات والشنط — كل قطعة بنختارها بعناية عشان تحسي إنها تشبهك."
            : "DODANA is the friend with taste — we find the cute things before you go looking for them. From skincare and haircare to perfumes, accessories, and bags — every piece is chosen with care so it feels like you."}
        </p>
        <p className="mt-6 text-balance leading-relaxed text-mocha-600">
          {locale === "ar"
            ? "بنوصل لكل محافظات مصر، وبنسهّل عليكِ الطلب سواء من الموقع أو مباشرة على واتساب."
            : "We deliver across Egypt and make ordering easy — through the website or straight over WhatsApp."}
        </p>
      </div>
    </div>
  );
}
