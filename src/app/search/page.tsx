import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { searchProducts } from "@/lib/queries";
import { ProductCard } from "@/components/product/product-card";
import { SparkleDivider } from "@/components/icons/decorative";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = (searchParams.q || "").trim();
  const t = await getTranslations("search");
  const tc = await getTranslations("common");
  const products = query ? await searchProducts(query) : [];

  return (
    <div className="container-dodana py-12">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl text-mocha-700">
          {query ? t("resultsFor", { query }) : t("prompt")}
        </h1>
        <SparkleDivider className="mt-4" />
      </div>

      {query && products.length === 0 && <p className="py-20 text-center text-mocha-400">{tc("noResults")}</p>}

      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
