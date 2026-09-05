import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getBestSellers } from "@/lib/queries";
import { ProductCard } from "@/components/product/product-card";
import { SparkleDivider } from "@/components/icons/decorative";

export const metadata: Metadata = {
  title: "Best Sellers",
  description: "DODANA's most-loved skincare, haircare, perfumes, accessories and bags.",
};

export default async function BestSellersPage() {
  const t = await getTranslations("sections");
  const tc = await getTranslations("common");
  const products = await getBestSellers(48);

  return (
    <div className="container-dodana py-12">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl text-mocha-700">{t("bestSellers")}</h1>
        <SparkleDivider className="mt-4" />
      </div>
      {products.length === 0 ? (
        <p className="py-20 text-center text-mocha-400">{tc("noResults")}</p>
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
