import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { SparkleDivider } from "@/components/icons/decorative";

export async function CategoryGrid() {
  const t = await getTranslations("sections");
  const locale = await getLocale();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <section className="container-dodana py-16">
      <div className="mb-10 text-center">
        <h2 className="font-heading text-3xl text-mocha-700">{t("shopByCategory")}</h2>
        <SparkleDivider className="mt-3" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="group flex flex-col items-center gap-3 rounded-card border border-mocha-700/5 bg-white p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
          >
            <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-ivory-200 sm:h-32">
              {cat.image && (
                <Image
                  src={cat.image}
                  alt={locale === "ar" ? cat.nameAr : cat.nameEn}
                  fill
                  sizes="200px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <span className="flex items-center gap-1.5 font-heading text-sm text-mocha-700 sm:text-base">
              <span aria-hidden="true">{cat.emoji}</span>
              {locale === "ar" ? cat.nameAr : cat.nameEn}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
