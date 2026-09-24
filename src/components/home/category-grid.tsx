import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { getActiveCategories } from "@/lib/queries";
import { DodanaImage } from "@/components/ui/dodana-image";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

export async function CategoryGrid() {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const categories = await getActiveCategories();
  if (categories.length === 0) return null;

  return (
    <section id="categories" aria-labelledby="categories-title" className="container-dodana scroll-mt-24 py-20 lg:py-28">
      <SectionHeading
        id="categories-title"
        eyebrow={t("categoriesEyebrow")}
        title={t("categoriesTitle")}
        action={{ href: "/shop", label: t("shopEverything") }}
      />

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-6 lg:grid-cols-5 lg:gap-5">
        {categories.map((cat, i) => {
          const name = locale === "ar" ? cat.nameAr : cat.nameEn;
          const isPlaceholder = cat.image?.startsWith("/placeholders/");
          // Mobile: the first card leads full-width. Tablet: two wide cards,
          // then three. Desktop: five equal columns.
          const span = cn(
            i === 0 && "col-span-2 md:col-span-3 lg:col-span-1",
            i === 1 && "md:col-span-3 lg:col-span-1",
            i > 1 && "md:col-span-2 lg:col-span-1"
          );
          return (
            <li key={cat.id} className={span}>
              <Reveal delay={i * 0.08} className="h-full">
                <Link
                  href={`/category/${cat.slug}`}
                  className={cn(
                    "group relative flex h-full flex-col justify-end overflow-hidden rounded-card bg-sand-100",
                    i === 0 ? "aspect-[16/11] md:aspect-[4/3] lg:aspect-[3/4.3]" : i === 1 ? "aspect-[3/4] md:aspect-[4/3] lg:aspect-[3/4.3]" : "aspect-[3/4] lg:aspect-[3/4.3]"
                  )}
                >
                  <DodanaImage
                    src={isPlaceholder ? `${cat.image}?v=2` : cat.image}
                    unoptimized={isPlaceholder}
                    alt={name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-mocha-900/65 via-mocha-900/10 to-transparent transition-opacity duration-700 group-hover:opacity-90" />
                  <span className="absolute start-4 top-4 font-heading text-sm text-ivory/85">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="relative flex items-end justify-between gap-3 p-4 sm:p-5">
                    <div className="min-w-0">
                      <h3 className="font-heading text-xl leading-tight text-ivory sm:text-2xl">{name}</h3>
                      {cat.productCount > 0 && (
                        <p className="mt-1 text-xs text-ivory/75">{t("pieces", { count: cat.productCount })}</p>
                      )}
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ivory/40 text-ivory backdrop-blur-sm transition-all duration-500 ease-luxe group-hover:border-ivory group-hover:bg-ivory group-hover:text-mocha-700">
                      <ArrowUpRight
                        size={17}
                        aria-hidden="true"
                        className="transition-transform duration-500 ease-luxe group-hover:rotate-45 rtl:-scale-x-100"
                      />
                    </span>
                  </div>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
