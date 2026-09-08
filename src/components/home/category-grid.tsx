import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { HeartIcon } from "@/components/icons/decorative";
import { DodanaImage } from "@/components/ui/dodana-image";

export async function CategoryGrid() {
  const t = await getTranslations("sections");
  const locale = await getLocale();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <section id="categories" className="container-dodana scroll-mt-20 py-16 lg:py-24">
      <div className="mb-10 text-center lg:mb-14">
        <h2 className="font-heading text-3xl text-mocha-700 sm:text-4xl">{t("shopByCategory")}</h2>
        <div className="mt-3 flex items-center justify-center gap-3" aria-hidden="true">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-mocha-700 to-transparent" />
          <HeartIcon className="h-3.5 w-3.5 text-blush-400" />
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-mocha-700 to-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="group relative block aspect-[4/5] overflow-hidden rounded-card"
          >
            <DodanaImage
              src={cat.image}
              alt={locale === "ar" ? cat.nameAr : cat.nameEn}
              fill
              sizes="(max-width: 640px) 45vw, 220px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-mocha-900/70 via-mocha-900/10 to-transparent transition-opacity duration-300 group-hover:from-mocha-900/80" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4">
              <span className="font-heading text-base text-ivory sm:text-lg">
                {locale === "ar" ? cat.nameAr : cat.nameEn}
              </span>
              <span className="flex max-h-0 items-center gap-1 overflow-hidden text-xs font-medium text-gold-200 opacity-0 transition-all duration-300 group-hover:max-h-5 group-hover:opacity-100">
                {t("shopNow")} <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
