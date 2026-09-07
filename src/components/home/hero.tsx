import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { DodanaImage } from "@/components/ui/dodana-image";
import type { ProductCardData } from "@/lib/serialize";

export async function Hero({ collageProducts = [] }: { collageProducts?: ProductCardData[] }) {
  const t = await getTranslations("hero");
  const locale = await getLocale();
  const [featured] = collageProducts;

  return (
    <section className="relative overflow-hidden bg-ivory">
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 end-[-8rem] h-80 w-80 rounded-full bg-blush-100/60 blur-3xl" />

      <div className="container-dodana relative grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-start">
          <h1 className="max-w-lg text-balance font-heading text-4xl leading-[1.1] text-mocha-700 sm:text-5xl lg:text-[3.4rem]">
            {locale === "ar" ? t("titleAr") : t("titleEn")}
          </h1>

          <p className="max-w-md text-balance text-base leading-relaxed text-mocha-500 sm:text-lg">{t("subtitle")}</p>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-500 sm:text-sm">{t("categoriesLine")}</p>

          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <Link href="/new-arrivals" className="btn-primary px-8 py-3.5 text-base">
              {t("cta")}
            </Link>
            <Link href="#categories" className="btn-secondary px-8 py-3.5 text-base">
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm lg:max-w-md">
          <div className="relative h-full w-full overflow-hidden rounded-card shadow-soft-lg">
            <DodanaImage
              src={featured?.image ?? null}
              alt={featured ? (locale === "ar" ? featured.nameAr : featured.nameEn) : "DODANA"}
              fill
              priority
              showWordmark
              sizes="(max-width: 1024px) 80vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
