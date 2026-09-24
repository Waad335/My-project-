import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { HeroStage } from "@/components/home/hero-stage";
import { getShowcaseItems } from "@/lib/queries";

export async function Hero() {
  const t = await getTranslations("hero");
  const locale = await getLocale();
  // Real DODANA imagery only: product photos, topped up with the store's own
  // category photography.
  const items = (await getShowcaseItems(6)).slice(0, 3);

  return (
    <HeroStage items={items} locale={locale} loadingLabel={t("loading")}>
      <div className="flex max-w-[34rem] flex-col items-start gap-5 text-start sm:gap-6">
        <p className="eyebrow flex animate-fade-up items-center gap-3">
          <span className="h-px w-8 bg-gold-400" aria-hidden="true" />
          {t("eyebrow")}
        </p>
        <h1
          id="hero-title"
          className="animate-fade-up text-balance font-heading text-[2.6rem] font-normal leading-[1.03] tracking-[-0.015em] text-mocha-700 [animation-delay:90ms] sm:text-6xl lg:text-[4.5rem] rtl:leading-[1.25] rtl:tracking-normal"
        >
          {t("headline")}
        </h1>
        <p className="max-w-md animate-fade-up text-[15px] leading-relaxed text-mocha-600 [animation-delay:180ms] sm:text-lg">
          {t("lead")}
        </p>
        <div className="mt-2 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:270ms]">
          <Link href="/shop" className="btn-primary px-7 py-3.5 tracking-[0.12em] sm:px-9 sm:tracking-[0.16em] rtl:tracking-normal">
            {t("shopNow")}
          </Link>
          <Link
            href="#categories"
            className="btn-secondary border-mocha-700/25 bg-ivory/40 px-7 py-3.5 tracking-[0.12em] backdrop-blur-sm sm:px-9 sm:tracking-[0.16em] rtl:tracking-normal"
          >
            {t("explore")}
          </Link>
        </div>
        <ul className="flex animate-fade-up flex-wrap gap-x-6 gap-y-1.5 text-xs text-mocha-600 [animation-delay:360ms] sm:text-[13px]">
          <li className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-gold-400" aria-hidden="true" />
            {t("pointSaudi")}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-gold-400" aria-hidden="true" />
            {t("pointDelivery")}
          </li>
        </ul>
        <div className="mt-8 hidden items-center gap-3 text-mocha-500 lg:flex" aria-hidden="true">
          <span className="relative h-10 w-px overflow-hidden bg-mocha-700/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-scroll-cue bg-mocha-700/60" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] rtl:normal-case rtl:tracking-normal">{t("scroll")}</span>
        </div>
      </div>
    </HeroStage>
  );
}
