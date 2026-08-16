import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/shopify";
import { getDigitalProductMeta } from "@/lib/shopify/digital-meta";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { getMockupCategory } from "@/lib/mockup-category";
import { AddToCart } from "@/components/shop/AddToCart";
import { PriceTag } from "@/components/ui/PriceTag";
import { Accordion } from "@/components/ui/Accordion";
import { ProductRecommendations } from "@/components/shop/ProductRecommendations";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { SITE_OG_IMAGE, SITE_URL } from "@/lib/constants";
import { getProductAsset } from "@/lib/product-assets";

type Params = Promise<{ handle: string }>;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ handle: product.handle }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return {};

  const asset = product.featuredImage ?? getProductAsset(handle) ?? SITE_OG_IMAGE;

  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    alternates: { canonical: `/products/${handle}` },
    openGraph: {
      title: product.title,
      description: product.description,
      images: [asset],
      type: "website",
      url: `${SITE_URL}/products/${handle}`,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description,
    },
  };
}

const FAQ_ITEMS = [
  {
    question: "How do I receive my files?",
    answer:
      "Instantly. After checkout, your download links are available on the order confirmation page and emailed to you immediately — no physical shipping, ever.",
  },
  {
    question: "Can I edit the template myself?",
    answer:
      "Yes. Every VELOURA template is built to be customized — swap colors, type, and content freely in the included formats (Canva, PDF, or native app files, depending on the product).",
  },
  {
    question: "What license do I get?",
    answer:
      "A single-user commercial license: use the template for your own resume, brand, or business. Reselling or redistributing the source files themselves isn't permitted.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Because these are instant-delivery digital files, all sales are final. If a file is missing or corrupted, contact us and we'll make it right.",
  },
];

export default async function ProductPage({ params }: { params: Params }) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  const meta = getDigitalProductMeta(product);
  const variant = product.variants[0];
  const images = product.images.length > 0
    ? product.images
    : product.featuredImage
      ? [product.featuredImage]
      : [];

  const ogImageUrl = product.featuredImage?.url ?? getProductAsset(handle)?.url ?? SITE_OG_IMAGE.url;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: ogImageUrl.startsWith("http") ? ogImageUrl : `${SITE_URL}${ogImageUrl}`,
    sku: variant?.id,
    brand: { "@type": "Brand", name: "VELOURA" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.handle}`,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      price: product.priceRange.minVariantPrice.amount,
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-32 md:px-10 lg:px-14 lg:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <ProductGallery
          images={images}
          handle={product.handle}
          title={product.title}
          category={getMockupCategory(product)}
        />

        <div className="lg:sticky lg:top-32 lg:self-start">
          {product.collections?.[0] && (
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gold-deep">
              {product.collections[0].title}
            </p>
          )}
          <h1 className="font-serif-display text-4xl leading-tight sm:text-5xl">{product.title}</h1>

          <div className="mt-5">
            <PriceTag
              amount={product.priceRange.minVariantPrice.amount}
              currencyCode={product.priceRange.minVariantPrice.currencyCode}
              compareAtAmount={product.compareAtPriceRange?.minVariantPrice.amount}
              size="lg"
            />
          </div>

          <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted">{product.description}</p>

          <div className="mt-8 max-w-xs">
            <AddToCart variant={variant} />
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-black/10 py-8 text-sm">
            {meta.fileFormats && (
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted">Format</dt>
                <dd className="mt-1">{meta.fileFormats.join(", ")}</dd>
              </div>
            )}
            {meta.pageCount && (
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted">Size</dt>
                <dd className="mt-1">{meta.pageCount}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">Canva Compatible</dt>
              <dd className="mt-1">{meta.canvaCompatible ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">Editable</dt>
              <dd className="mt-1">{meta.editable ? "Yes" : "No"}</dd>
            </div>
            {meta.license && (
              <div className="col-span-2">
                <dt className="text-xs uppercase tracking-[0.14em] text-muted">License</dt>
                <dd className="mt-1">{meta.license}</dd>
              </div>
            )}
          </dl>

          {meta.includedFiles && (
            <div className="mt-8">
              <h2 className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">What&apos;s Included</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {meta.includedFiles.map((file) => (
                  <li key={file} className="flex items-center gap-2">
                    <span className="text-gold-deep" aria-hidden="true">
                      &#10022;
                    </span>
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <h2 className="mb-1 text-xs uppercase tracking-[0.18em] text-muted">Frequently Asked</h2>
            <Accordion items={FAQ_ITEMS} />
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <section className="mt-28" aria-hidden="true">
            <h2 className="font-serif-display mb-10 text-3xl text-black/20">You May Also Like</h2>
            <ProductGridSkeleton count={4} />
          </section>
        }
      >
        <ProductRecommendations productId={product.id} />
      </Suspense>
    </div>
  );
}
