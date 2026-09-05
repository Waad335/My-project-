import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ReviewsList } from "@/components/product/reviews-list";
import { ProductSection } from "@/components/home/product-section";
import { Accordion } from "@/components/ui/accordion";
import { Truck, RotateCcw } from "lucide-react";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};
  return {
    title: product.nameEn,
    description: product.descriptionEn.slice(0, 160),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.nameEn,
      description: product.descriptionEn.slice(0, 160),
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const locale = await getLocale();
  const t = await getTranslations("product");
  const tSections = await getTranslations("sections");

  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const dbProduct = await prisma.product.findUnique({ where: { slug: params.slug }, select: { categoryId: true } });
  const related = dbProduct ? await getRelatedProducts(dbProduct.categoryId, product.id, 4) : [];

  const accordionItems = [
    { title: t("description"), content: locale === "ar" ? product.descriptionAr : product.descriptionEn },
    ...(product.ingredientsEn || product.ingredientsAr
      ? [{ title: t("ingredients"), content: locale === "ar" ? product.ingredientsAr : product.ingredientsEn }]
      : []),
    ...(product.warningsEn || product.warningsAr
      ? [{ title: t("warnings"), content: locale === "ar" ? product.warningsAr : product.warningsEn }]
      : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameEn,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    description: product.descriptionEn,
    brand: { "@type": "Brand", name: "DODANA" },
    offers: {
      "@type": "Offer",
      priceCurrency: "EGP",
      price: product.effectivePrice,
      availability:
        product.availability === "OUT_OF_STOCK"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };

  return (
    <div className="container-dodana py-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images.map((img) => ({
            url: img.url,
            alt: (locale === "ar" ? img.altAr : img.altEn) || product.nameEn,
          }))}
          fallbackAlt={product.nameEn}
        />
        <ProductPurchasePanel product={product} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card-surface flex items-start gap-3 p-4">
          <Truck size={20} className="mt-0.5 flex-shrink-0 text-gold-500" />
          <div>
            <p className="text-sm font-semibold text-mocha-700">{t("deliveryInfo")}</p>
            <p className="text-xs text-mocha-500">{t("deliveryInfoBody")}</p>
          </div>
        </div>
        <div className="card-surface flex items-start gap-3 p-4">
          <RotateCcw size={20} className="mt-0.5 flex-shrink-0 text-gold-500" />
          <div>
            <p className="text-sm font-semibold text-mocha-700">{t("returnInfo")}</p>
            <p className="text-xs text-mocha-500">
              {t("returnInfoBody")}{" "}
              <a href="/policies/returns" className="underline hover:text-mocha-700">
                {locale === "ar" ? "عرض السياسة" : "View policy"}
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 max-w-3xl">
        <Accordion items={accordionItems as { title: string; content: string }[]} />
      </div>

      <div className="mt-14 max-w-3xl">
        <h2 className="mb-5 font-heading text-2xl text-mocha-700">{tSections("reviews")}</h2>
        <ReviewsList product={product} />
      </div>

      {related.length > 0 && (
        <div className="mt-8 -mx-4 sm:mx-0">
          <ProductSection title={tSections("youMayAlsoLike")} products={related} />
        </div>
      )}
    </div>
  );
}
