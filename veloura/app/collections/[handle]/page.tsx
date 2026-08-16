import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionProducts, getCollections } from "@/lib/shopify";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Reveal } from "@/components/ui/Reveal";
import { SITE_OG_IMAGE, SITE_URL } from "@/lib/constants";
import { getCollectionAsset } from "@/lib/collection-assets";

type Params = Promise<{ handle: string }>;

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ handle: c.handle }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { handle } = await params;
  const result = await getCollectionProducts(handle);
  if (!result) return {};

  const asset = result.collection.image ?? getCollectionAsset(handle) ?? SITE_OG_IMAGE;

  return {
    title: result.collection.seo.title || result.collection.title,
    description: result.collection.seo.description || result.collection.description,
    alternates: { canonical: `/collections/${handle}` },
    openGraph: {
      title: result.collection.title,
      description: result.collection.description,
      images: [asset],
      url: `${SITE_URL}/collections/${handle}`,
    },
  };
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { handle } = await params;
  const result = await getCollectionProducts(handle);
  if (!result) notFound();

  const { collection, products } = result;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.title,
    description: collection.description,
    url: `${SITE_URL}/collections/${handle}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/products/${product.handle}`,
        name: product.title,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-32 md:px-10 lg:px-14 lg:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Reveal className="mb-14 max-w-2xl">
        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold-deep">Collection</p>
        <h1 className="font-serif-display text-4xl leading-[1.05] sm:text-5xl">{collection.title}</h1>
        {collection.description && (
          <p className="mt-4 text-sm leading-relaxed text-muted">{collection.description}</p>
        )}
      </Reveal>

      <ProductGrid products={products} />
    </div>
  );
}
