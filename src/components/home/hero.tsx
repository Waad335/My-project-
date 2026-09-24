import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { HeroStage } from "@/components/home/hero-stage";
import type { HeroCategoryHrefs } from "@/components/3d/HeroScene";
import { getActiveCategories } from "@/lib/queries";

const SCENE_CATEGORIES = ["perfumes", "skincare", "haircare", "accessories", "bags"] as const;

export async function Hero() {
  const t = await getTranslations("hero");
  const locale = await getLocale();
  const categories = await getActiveCategories();

  // Products in the 3D scene link to their category — but only to
  // categories that actually exist and are live.
  const categoryHrefs: HeroCategoryHrefs = {};
  for (const slug of SCENE_CATEGORIES) {
    if (categories.some((c) => c.slug === slug)) categoryHrefs[slug] = `/category/${slug}`;
  }

  return (
    <HeroStage
      categoryHrefs={categoryHrefs}
      mirror={locale === "ar"}
      fallbackAlt={t("imageAlt")}
      scrollLabel={t("scroll")}
    >
      <div className="flex max-w-[34rem] flex-col items-start gap-4 text-start sm:gap-6 lg:max-w-[36rem]">
        <p className="eyebrow animate-fade-up">{t("eyebrow")}</p>
        <h1
          id="hero-title"
          className="animate-fade-up text-balance font-heading text-[2.45rem] font-normal leading-[1.04] tracking-[-0.01em] text-mocha-700 [animation-delay:90ms] sm:text-6xl lg:text-[4.25rem] rtl:leading-[1.25] rtl:tracking-normal"
        >
          {t("headline")}
        </h1>
        <p className="max-w-md animate-fade-up text-[15px] leading-relaxed text-mocha-600 [animation-delay:180ms] sm:text-lg">
          {t("lead")}
        </p>
        <div className="mt-1 flex animate-fade-up flex-wrap items-center gap-2.5 [animation-delay:270ms] sm:gap-3">
          <Link href="/shop" className="btn-primary px-6 py-3.5 tracking-[0.1em] sm:px-8 sm:tracking-[0.14em] rtl:tracking-normal">
            {t("shopNow")}
          </Link>
          <Link
            href="#categories"
            className="btn-secondary border-mocha-700/25 bg-ivory/40 px-6 py-3.5 tracking-[0.1em] backdrop-blur-sm sm:px-8 sm:tracking-[0.14em] rtl:tracking-normal"
          >
            {t("explore")}
          </Link>
        </div>
        <ul className="mt-1 flex animate-fade-up flex-wrap gap-x-5 gap-y-1.5 text-xs text-mocha-600 [animation-delay:360ms] sm:text-[13px]">
          <li className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-gold-400" aria-hidden="true" />
            {t("pointSaudi")}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-gold-400" aria-hidden="true" />
            {t("pointDelivery")}
          </li>
        </ul>
      </div>
    </HeroStage>
  );
}
