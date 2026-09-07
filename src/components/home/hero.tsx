import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";

export async function Hero() {
  const t = await getTranslations("hero");
  const locale = await getLocale();
  const isRtl = locale === "ar";

  return (
    <section className="relative flex min-h-[68vh] w-full items-start overflow-hidden sm:min-h-[75vh] sm:items-center lg:min-h-[85vh]">
      <div className="absolute inset-0 bg-blush-50">
        <Image
          src="/hero/hero-visual.png"
          alt="DODANA — curated skincare, perfumes, accessories and bags"
          fill
          priority
          sizes="100vw"
          className={`object-contain object-bottom sm:object-center ${isRtl ? "scale-x-[-1]" : ""}`}
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
      </div>

      <div className="container-dodana relative z-10 py-16 sm:py-20">
        <div className="flex max-w-[15.5rem] flex-col items-start gap-6 text-start sm:max-w-md lg:max-w-lg">
          <h1 className="text-balance font-heading text-4xl leading-[1.1] text-mocha-700 sm:text-5xl lg:text-[3.4rem]">
            {locale === "ar" ? t("titleAr") : t("titleEn")}
          </h1>

          <p className="max-w-md text-balance text-base leading-relaxed text-mocha-600 sm:text-lg">{t("subtitle")}</p>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-600 sm:text-sm">{t("categoriesLine")}</p>

          <div className="mt-2 flex flex-col items-start gap-3 sm:flex-row">
            <Link href="/new-arrivals" className="btn-primary px-8 py-3.5 text-base">
              {t("cta")}
            </Link>
            <Link href="#categories" className="btn-secondary border-mocha-700/30 px-8 py-3.5 text-base backdrop-blur-sm">
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
