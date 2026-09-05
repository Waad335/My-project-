import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { HeartIcon, SparkleDivider } from "@/components/icons/decorative";

export async function Hero() {
  const t = await getTranslations("hero");
  const locale = await getLocale();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blush-100 via-ivory to-ivory">
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 start-[-4rem] h-64 w-64 rounded-full bg-blush-200/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-24 end-[-6rem] h-72 w-72 rounded-full bg-gold-100/60 blur-3xl" />

      <div className="container-dodana relative flex flex-col items-center gap-6 py-20 text-center sm:py-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
          {t("eyebrow")} <HeartIcon className="h-3 w-3 text-blush-400" />
        </span>

        <h1 className="max-w-3xl text-balance font-heading text-4xl leading-tight text-mocha-700 sm:text-5xl md:text-6xl">
          {locale === "ar" ? t("titleAr") : t("titleEn")}
        </h1>
        <p className="font-heading text-lg italic text-blush-400 sm:text-xl">
          {locale === "ar" ? t("titleEn") : t("titleAr")}
        </p>

        <SparkleDivider />

        <p className="max-w-xl text-balance text-base text-mocha-500 sm:text-lg">{t("subtitle")}</p>

        <Link href="/category/skincare" className="btn-primary mt-2 px-8 py-3.5 text-base">
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
