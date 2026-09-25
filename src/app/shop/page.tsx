import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getShopFilterCategories, getShopProducts, SHOP_SORTS, type ShopSort } from "@/lib/queries";
import { ProductCard } from "@/components/product/product-card";
import { ShopControls } from "@/components/shop/shop-controls";
import { cn } from "@/lib/utils";

type SearchParams = { q?: string; category?: string; sort?: string; page?: string };

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const filtered = Boolean(searchParams.q || searchParams.sort || (searchParams.page && searchParams.page !== "1"));
  return {
    title: "Shop",
    description:
      "Shop DODANA — skincare, haircare, perfumes, accessories and bags, carefully selected in Saudi Arabia and delivered across Egypt.",
    alternates: { canonical: searchParams.category ? `/shop?category=${encodeURIComponent(searchParams.category)}` : "/shop" },
    // Search/sort permutations shouldn't be indexed as separate pages.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("shop");
  const sort: ShopSort = SHOP_SORTS.includes(searchParams.sort as ShopSort) ? (searchParams.sort as ShopSort) : "featured";
  const categories = await getShopFilterCategories();
  const categorySlug = categories.some((c) => c.slug === searchParams.category) ? searchParams.category : undefined;
  const { products, total, page, pageCount } = await getShopProducts({
    q: searchParams.q,
    categorySlug,
    sort,
    page: Number(searchParams.page) || 1,
  });

  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (searchParams.q) qs.set("q", searchParams.q);
    if (categorySlug) qs.set("category", categorySlug);
    if (sort !== "featured") qs.set("sort", sort);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  return (
    <div className="group/shop">
      <header className="studio-backdrop border-b border-mocha-700/8">
        <div className="container-dodana flex flex-col items-center gap-4 py-14 text-center lg:py-20">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="font-heading text-[2.6rem] leading-none tracking-[0.04em] text-mocha-700 sm:text-6xl lg:text-7xl rtl:tracking-normal">
            {t("title")}
          </h1>
          <p className="max-w-lg text-[15px] leading-relaxed text-mocha-600">{t("subtitle")}</p>
        </div>
      </header>

      <div className="container-dodana py-10 lg:py-14">
        <ShopControls categories={categories} total={total} />

        <section aria-label={t("resultsLabel")} className="mt-10 transition-opacity duration-300 group-has-[[data-pending]]/shop:opacity-50">
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-mocha-700/15 px-6 py-20 text-center">
              <p className="font-heading text-2xl text-mocha-700">{t("emptyTitle")}</p>
              <p className="max-w-sm text-sm text-mocha-500">{t("emptyBody")}</p>
              <Link href="/shop" className="btn-secondary mt-2">
                {t("clearFilters")}
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
              {products.map((product, i) => (
                <li key={product.id}>
                  <ProductCard product={product} priority={i < 4} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {pageCount > 1 && (
          <nav aria-label={t("pagination")} className="mt-16 flex items-center justify-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={pageHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex h-11 min-w-[2.75rem] items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors",
                  p === page ? "border-mocha-700 bg-mocha-700 text-ivory" : "border-mocha-700/15 text-mocha-600 hover:border-mocha-700/50"
                )}
              >
                {p}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
