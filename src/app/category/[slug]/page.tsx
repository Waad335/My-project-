import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getProductsByCategory } from "@/lib/queries";
import { ProductCard } from "@/components/product/product-card";
import { FilterBar } from "@/components/catalog/filter-bar";
import { SparkleDivider } from "@/components/icons/decorative";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { category } = await getProductsByCategory(params.slug);
  if (!category) return {};
  return {
    title: category.nameEn,
    description: category.descriptionEn ?? undefined,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sub?: string; sort?: string; min?: string; max?: string };
}) {
  const locale = await getLocale();
  const t = await getTranslations("common");
  const { category, products } = await getProductsByCategory(params.slug, {
    subcategorySlug: searchParams.sub,
    sort: (searchParams.sort as "newest" | "price-asc" | "price-desc" | "rating") || "newest",
    minPrice: searchParams.min ? Number(searchParams.min) : undefined,
    maxPrice: searchParams.max ? Number(searchParams.max) : undefined,
  });

  if (!category) notFound();

  return (
    <div className="container-dodana py-12">
      <div className="mb-8 text-center">
        <span className="text-3xl" aria-hidden="true">
          {category.emoji}
        </span>
        <h1 className="mt-2 font-heading text-3xl text-mocha-700">
          {locale === "ar" ? category.nameAr : category.nameEn}
        </h1>
        {category.descriptionEn && (
          <p className="mx-auto mt-2 max-w-md text-sm text-mocha-500">
            {locale === "ar" ? category.descriptionAr : category.descriptionEn}
          </p>
        )}
        <SparkleDivider className="mt-4" />
      </div>

      <FilterBar
        subcategories={category.subcategories.map((s) => ({ slug: s.slug, nameEn: s.nameEn, nameAr: s.nameAr }))}
      />

      {products.length === 0 ? (
        <p className="py-20 text-center text-mocha-400">{t("noResults")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
