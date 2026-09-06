import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { SparkleDivider } from "@/components/icons/decorative";
import { DodanaImage } from "@/components/ui/dodana-image";

export async function CategoryGrid() {
  const t = await getTranslations("sections");
  const locale = await getLocale();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <section id="categories" className="container-dodana scroll-mt-20 py-16">
      <div className="mb-10 text-center">
        <h2 className="font-heading text-3xl text-mocha-700">{t("shopByCategory")}</h2>
        <SparkleDivider className="mt-3" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="group flex flex-col overflow-hidden rounded-card border border-mocha-700/5 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-ivory-200">
              <DodanaImage
                src={cat.image}
                alt={locale === "ar" ? cat.nameAr : cat.nameEn}
                fill
                sizes="(max-width: 640px) 45vw, 200px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col items-center gap-0.5 px-2 py-3 text-center">
              <span className="flex items-center gap-1.5 font-heading text-sm text-mocha-700 sm:text-base">
                <span aria-hidden="true">{cat.emoji}</span>
                {locale === "ar" ? cat.nameAr : cat.nameEn}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-gold-500 transition group-hover:gap-1.5">
                {t("shopNow")} <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
