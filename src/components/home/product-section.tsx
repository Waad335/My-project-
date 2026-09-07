import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ProductCardData } from "@/lib/serialize";
import { ProductCard } from "@/components/product/product-card";
import { SparkleDivider } from "@/components/icons/decorative";

export async function ProductSection({
  title,
  subtitle,
  products,
  viewAllHref,
  tone = "ivory",
}: {
  title: string;
  subtitle?: string;
  products: ProductCardData[];
  viewAllHref?: string;
  tone?: "ivory" | "blush";
}) {
  const t = await getTranslations("common");
  if (products.length === 0) return null;

  return (
    <section className={tone === "blush" ? "bg-blush-50 py-16 lg:py-24" : "py-16 lg:py-24"}>
      <div className="container-dodana">
        <div className="mb-10 flex flex-col items-center gap-2 text-center lg:mb-14">
          <h2 className="font-heading text-3xl text-mocha-700 sm:text-4xl">{title}</h2>
          {subtitle && <p className="max-w-md text-sm text-mocha-500">{subtitle}</p>}
          <SparkleDivider className="mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {viewAllHref && (
          <div className="mt-10 text-center">
            <Link href={viewAllHref} className="btn-secondary">
              {t("viewAll")}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
