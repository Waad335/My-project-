import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { BowIcon } from "@/components/icons/decorative";
import { DodanaImage } from "@/components/ui/dodana-image";
import type { ProductCardData } from "@/lib/serialize";

export async function Hero({ collageProducts = [] }: { collageProducts?: ProductCardData[] }) {
  const t = await getTranslations("hero");
  const locale = await getLocale();
  const [a, b, c] = collageProducts;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blush-100 via-ivory to-ivory">
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 start-[-4rem] h-64 w-64 rounded-full bg-blush-200/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-24 end-[-6rem] h-72 w-72 rounded-full bg-gold-100/60 blur-3xl" />

      <div className="container-dodana relative grid grid-cols-1 items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-8 lg:py-24">
        <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-start">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
            {t("eyebrow")}
          </span>

          <h1 className="max-w-lg text-balance font-heading text-4xl leading-tight text-mocha-700 sm:text-5xl lg:text-6xl">
            {locale === "ar" ? t("titleAr") : t("titleEn")}
          </h1>
          <p className="font-heading text-lg italic text-blush-400 sm:text-xl">
            {locale === "ar" ? t("titleEn") : t("titleAr")}
          </p>

          <p className="max-w-md text-balance text-base text-mocha-500 sm:text-lg">{t("subtitle")}</p>

          <div className="mt-1 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <Link href="/new-arrivals" className="btn-primary px-8 py-3.5 text-base">
              {t("cta")}
            </Link>
            <Link href="#categories" className="btn-secondary px-8 py-3.5 text-base">
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-[5/4] w-full max-w-md lg:max-w-none">
          <div className="absolute start-0 top-0 h-[68%] w-[62%] -rotate-2 overflow-hidden rounded-card border-4 border-white shadow-soft-lg">
            <DodanaImage
              src={a?.image ?? null}
              alt={a ? (locale === "ar" ? a.nameAr : a.nameEn) : "DODANA"}
              fill
              priority
              showWordmark
              sizes="(max-width: 1024px) 60vw, 30vw"
              className="object-cover"
            />
          </div>

          <div className="absolute bottom-0 end-0 h-[56%] w-[52%] rotate-3 overflow-hidden rounded-card border-4 border-white shadow-soft-lg">
            <DodanaImage
              src={b?.image ?? null}
              alt={b ? (locale === "ar" ? b.nameAr : b.nameEn) : "DODANA"}
              fill
              showWordmark
              sizes="(max-width: 1024px) 50vw, 26vw"
              className="object-cover"
            />
          </div>

          <div className="absolute end-[6%] top-[10%] h-[30%] w-[30%] -rotate-6 overflow-hidden rounded-2xl border-4 border-white shadow-soft">
            <DodanaImage
              src={c?.image ?? null}
              alt={c ? (locale === "ar" ? c.nameAr : c.nameEn) : "DODANA"}
              fill
              sizes="(max-width: 1024px) 30vw, 15vw"
              className="object-cover"
            />
          </div>

          <div className="absolute start-[8%] bottom-[6%] flex h-16 w-16 items-center justify-center rounded-full border border-gold-300 bg-white shadow-gold sm:h-20 sm:w-20">
            <div className="flex flex-col items-center gap-0.5 text-mocha-700">
              <BowIcon className="h-4 w-4 text-blush-400 sm:h-5 sm:w-5" />
              <span className="font-heading text-[10px] tracking-wide sm:text-xs">DODANA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
