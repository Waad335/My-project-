interface ProductAsset {
  url: string;
  width: number;
  height: number;
}

/**
 * Real, SKU-specific hero imagery for a product, extracted from the
 * approved VELOURA Visual System. Used as a fallback between a live
 * Shopify `product.featuredImage` and the generated `ProductMockup`.
 */
const PRODUCT_ASSETS: Record<string, ProductAsset> = {
  "atelier-resume-template": {
    url: "/images/products/01-atelier-resume-template.png",
    width: 684,
    height: 856,
  },
  "maison-cover-letter-suite": {
    url: "/images/products/02-maison-cover-letter-suite.png",
    width: 684,
    height: 856,
  },
  "reverie-brand-kit": {
    url: "/images/products/03-reverie-brand-kit.png",
    width: 684,
    height: 856,
  },
  "solace-daily-planner": {
    url: "/images/products/04-solace-daily-planner.png",
    width: 684,
    height: 856,
  },
  "quiet-hours-weekly-planner": {
    url: "/images/products/05-quiet-hours-weekly-planner.png",
    width: 684,
    height: 856,
  },
  "editorial-social-kit": {
    url: "/images/products/06-editorial-social-kit.png",
    width: 684,
    height: 856,
  },
  "atelier-carousel-pack": {
    url: "/images/products/07-atelier-carousel-pack.png",
    width: 684,
    height: 856,
  },
  "founders-proposal-template": {
    url: "/images/products/08-founders-proposal-template.png",
    width: 684,
    height: 856,
  },
  "ledger-invoice-set": {
    url: "/images/products/09-ledger-invoice-set.png",
    width: 684,
    height: 856,
  },
  "grayscale-pitch-deck": {
    url: "/images/products/10-grayscale-pitch-deck.png",
    width: 684,
    height: 856,
  },
  "linen-resume-template": {
    url: "/images/products/11-linen-resume-template.png",
    width: 684,
    height: 856,
  },
  "atelier-brand-board": {
    url: "/images/products/12-atelier-brand-board.png",
    width: 684,
    height: 856,
  },
};

export function getProductAsset(handle: string): ProductAsset | null {
  return PRODUCT_ASSETS[handle] ?? null;
}
