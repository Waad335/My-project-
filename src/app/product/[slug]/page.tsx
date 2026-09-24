import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { Product3DViewer } from "@/components/product/product-3d-viewer";
import { ProductTabs } from "@/components/product/product-tabs";
import { ReviewsList } from "@/components/product/reviews-list";
import { ProductRail } from "@/components/home/product-rail";
import { SectionHeading } from "@/components/home/section-heading";
import { modelKindForProduct } from "@/components/3d/model-kind";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};
  const description = product.descriptionEn.slice(0, 160);
  return {
    title: product.nameEn,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.nameEn} — DODANA`,
      description,
      images: product.image ? [{ url: product.image }] : undefined,
    },
    twitter: { card: "summary_large_image", title: product.nameEn, description },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const locale = await getLocale();
  const t = await getTranslations("product");
  const tSections = await getTranslations("sections");
  const tNav = await getTranslations("nav");

  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const dbProduct = await prisma.product.findUnique({ where: { slug: params.slug }, select: { categoryId: true } });
  const related = dbProduct ? await getRelatedProducts(dbProduct.categoryId, product.id, 8) : [];

  const ar = locale === "ar";
  const name = ar ? product.nameAr : product.nameEn;
  const categoryName = ar ? product.categoryNameAr : product.categoryNameEn;
  const subcategoryName = ar ? product.subcategoryNameAr : product.subcategoryNameEn;
  const description = ar ? product.descriptionAr : product.descriptionEn;
  const ingredients = ar ? product.ingredientsAr : product.ingredientsEn;
  const warnings = ar ? product.warningsAr : product.warningsEn;
  const modelKind = modelKindForProduct(product.categorySlug, product.subcategorySlug);
  const outOfStock = product.trackStock && (product.availability === "OUT_OF_STOCK" || product.stock === 0);

  const colors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)));
  const sizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean)));
  const details: [string, string][] = [
    [t("category"), categoryName],
    ...(subcategoryName ? ([[t("subcategory"), subcategoryName]] as [string, string][]) : []),
    ...(colors.length ? ([[t("color"), colors.join(", ")]] as [string, string][]) : []),
    ...(sizes.length ? ([[t("size"), sizes.join(", ")]] as [string, string][]) : []),
    [t("availability"), outOfStock ? t("outOfStock") : t("inStock")],
    [t("sku"), product.sku],
    [t("origin"), t("originValue")],
  ];

  const tabs = [
    {
      id: "description",
      label: t("description"),
      content: <p className="max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-mocha-600">{description}</p>,
    },
    {
      id: "details",
      label: t("details"),
      content: (
        <dl className="grid max-w-3xl grid-cols-1 border-t border-mocha-700/8 sm:grid-cols-2 sm:gap-x-10">
          {details.map(([term, value]) => (
            <div key={term} className="flex justify-between gap-6 border-b border-mocha-700/8 py-3.5 text-sm">
              <dt className="text-mocha-500">{term}</dt>
              <dd className="text-end font-medium text-mocha-700">{value}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    ...(ingredients || warnings
      ? [
          {
            id: "ingredients",
            label: t("ingredientsTab"),
            content: (
              <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
                {ingredients && (
                  <div>
                    <h3 className="mb-2 font-heading text-lg text-mocha-700">{t("ingredients")}</h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-mocha-600">{ingredients}</p>
                  </div>
                )}
                {warnings && (
                  <div>
                    <h3 className="mb-2 font-heading text-lg text-mocha-700">{t("warnings")}</h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-mocha-600">{warnings}</p>
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      id: "reviews",
      label: `${tSections("reviews")} (${product.ratingCount})`,
      content: (
        <div className="max-w-3xl">
          <ReviewsList product={product} />
        </div>
      ),
    },
  ];

  const url = `${SITE_URL}/product/${product.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.nameEn,
      sku: product.sku,
      url,
      image: product.images.map((i) => (i.url.startsWith("http") ? i.url : `${SITE_URL}${i.url}`)),
      description: product.descriptionEn,
      category: product.categoryNameEn,
      brand: { "@type": "Brand", name: "DODANA" },
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "EGP",
        price: product.effectivePrice,
        itemCondition: "https://schema.org/NewCondition",
        availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
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
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "DODANA", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: product.categoryNameEn, item: `${SITE_URL}/category/${product.categorySlug}` },
        { "@type": "ListItem", position: 3, name: product.nameEn, item: url },
      ],
    },
  ];

  return (
    <div className="container-dodana pb-10 pt-6 lg:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label={t("breadcrumb")} className="mb-6 text-xs text-mocha-500 lg:mb-8">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-mocha-800">
              {tNav("home")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/category/${product.categorySlug}`} className="hover:text-mocha-800">
              {categoryName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-mocha-700">
            {name}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
        <ProductGallery
          images={product.images.map((img) => ({
            url: img.url,
            alt: (ar ? img.altAr : img.altEn) || name,
          }))}
          fallbackAlt={name}
          overlay={modelKind ? <Product3DViewer kind={modelKind} productName={name} /> : undefined}
        />
        <div className="flex flex-col gap-8">
          <ProductPurchasePanel product={product} />
          <ul className="flex flex-col divide-y divide-mocha-700/8 rounded-card border border-mocha-700/8 bg-ivory-50 text-sm">
            <li className="flex gap-3 p-4">
              <Truck size={18} className="mt-0.5 shrink-0 text-gold-500" aria-hidden="true" />
              <div>
                <p className="font-medium text-mocha-700">{t("deliveryInfo")}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-mocha-500">{t("deliveryInfoBody")}</p>
              </div>
            </li>
            <li className="flex gap-3 p-4">
              <RotateCcw size={18} className="mt-0.5 shrink-0 text-gold-500" aria-hidden="true" />
              <div>
                <p className="font-medium text-mocha-700">{t("returnInfo")}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-mocha-500">
                  {t("returnInfoBody")}{" "}
                  <Link href="/policies/returns" className="underline underline-offset-2 hover:text-mocha-700">
                    {t("viewPolicy")}
                  </Link>
                </p>
              </div>
            </li>
            <li className="flex gap-3 p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gold-500" aria-hidden="true" />
              <div>
                <p className="font-medium text-mocha-700">{t("secureTitle")}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-mocha-500">{t("secureBody")}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <section id="product-details" aria-label={t("detailsSection")} className="mt-16 scroll-mt-28 lg:mt-24">
        <ProductTabs tabs={tabs} label={t("detailsSection")} />
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-20 lg:mt-28">
          <SectionHeading id="related-title" eyebrow={t("relatedEyebrow")} title={tSections("youMayAlsoLike")} />
          <ProductRail products={related} label={tSections("youMayAlsoLike")} />
        </section>
      )}
    </div>
  );
}
