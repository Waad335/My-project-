interface CollectionAsset {
  url: string;
  width: number;
  height: number;
}

/**
 * Real, generic (non-SKU-specific) marketing imagery for a collection.
 * Used as a fallback between a live Shopify `collection.image` and the
 * generated `ProductMockup` — never claims to depict a specific product,
 * only the category as a whole, so it's safe to use without per-SKU
 * confirmation. Add an entry here only once a suitable category-level
 * asset has been provided and rendered into `public/images/collections/`.
 */
const COLLECTION_ASSETS: Record<string, CollectionAsset> = {
  "digital-planners": {
    url: "/images/collections/digital-planners.png",
    width: 990,
    height: 990,
  },
};

export function getCollectionAsset(handle: string): CollectionAsset | null {
  return COLLECTION_ASSETS[handle] ?? null;
}
