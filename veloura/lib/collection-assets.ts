interface CollectionAsset {
  url: string;
  width: number;
  height: number;
}

/**
 * Real, generic (non-SKU-specific) marketing imagery for a collection,
 * extracted from the approved VELOURA Visual System. Used as a fallback
 * between a live Shopify `collection.image` and the generated
 * `ProductMockup` — never claims to depict a specific product, only the
 * category as a whole, so it's safe to use without per-SKU confirmation.
 */
const COLLECTION_ASSETS: Record<string, CollectionAsset> = {
  "resume-templates": {
    url: "/images/collections/resume-templates.png",
    width: 684,
    height: 856,
  },
  "brand-kits": {
    url: "/images/collections/brand-kits.png",
    width: 684,
    height: 856,
  },
  "digital-planners": {
    url: "/images/collections/digital-planners.png",
    width: 684,
    height: 856,
  },
  "social-media": {
    url: "/images/collections/social-media.png",
    width: 684,
    height: 856,
  },
  "business-essentials": {
    url: "/images/collections/business-essentials.png",
    width: 684,
    height: 856,
  },
};

export function getCollectionAsset(handle: string): CollectionAsset | null {
  return COLLECTION_ASSETS[handle] ?? null;
}
