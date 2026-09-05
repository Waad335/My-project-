import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getNewArrivals } from "@/lib/queries";
import { ProductCard } from "@/components/product/product-card";
import { SparkleDivider } from "@/components/icons/decorative";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "Fresh in at DODANA — before everyone else finds out.",
};

export default async function NewArrivalsPage() {
  const t = await getTranslations("sections");
  const tc = await getTranslations("common");
  const products = await getNewArrivals(48);

  return (
    <div className="container-dodana py-12">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl text-mocha-700">{t("newArrivals")}</h1>
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
