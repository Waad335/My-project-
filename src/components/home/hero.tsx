import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";

export async function Hero() {
  const t = await getTranslations("hero");
  const locale = await getLocale();
  const isRtl = locale === "ar";

  return (
    <section className="relative flex min-h-[max(600px,82vh)] w-full items-start overflow-hidden sm:aspect-square sm:min-h-0 sm:items-center lg:aspect-[4/3]">
      <div className="absolute inset-0">
        <Image
          src="/hero/hero-visual.png"
          alt="DODANA — curated skincare, perfumes, accessories and bags"
          fill
          priority
          sizes="100vw"
          className={`object-cover object-right-bottom ${isRtl ? "scale-x-[-1]" : ""}`}
        />
        {/* Light wash so the copy stays legible over the photo — always on the
            side the text renders on (locale "start"), never a dark/muddy tint. */}
        <div
          className={`absolute inset-0 ${
            isRtl
              ? "bg-gradient-to-l from-ivory/90 via-ivory/40 to-transparent sm:from-ivory/80 sm:via-ivory/20 sm:to-transparent"
              : "bg-gradient-to-r from-ivory/90 via-ivory/40 to-transparent sm:from-ivory/80 sm:via-ivory/20 sm:to-transparent"
          }`}
        />
        {/* Mobile-only top wash: the narrow column forces the crop close to the
            product cluster, so this keeps the stacked copy readable without a hard edge. */}
        <div className="absolute inset-0 bg-gradient-to-b from-ivory/85 via-ivory/35 to-transparent sm:hidden" />
      </div>

      <div className="container-dodana relative z-10 pt-2 pb-16 sm:py-20">
        <div className="flex max-w-[15.5rem] flex-col items-start gap-3 text-start sm:max-w-md sm:gap-6 lg:max-w-lg">
          <h1 className="text-balance font-heading text-4xl leading-[1.1] text-mocha-700 sm:text-5xl lg:text-[3.4rem]">
            {locale === "ar" ? t("titleAr") : t("titleEn")}
          </h1>

          <p className="max-w-md text-balance text-base leading-relaxed text-mocha-600 sm:text-lg">{t("subtitle")}</p>

          <p className="text-xs font-medium uppercase tracking-[0.08em] text-gold-600 sm:tracking-[0.18em] sm:text-sm">{t("categoriesLine")}</p>

          <div className="flex flex-row flex-wrap items-start gap-2 sm:mt-2 sm:gap-3">
            <Link href="/new-arrivals" className="btn-primary px-8 py-2.5 text-base sm:py-3.5">
              {t("cta")}
            </Link>
            <Link href="#categories" className="btn-secondary border-mocha-700/30 px-8 py-2.5 text-base backdrop-blur-sm sm:py-3.5">
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
