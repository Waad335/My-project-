export type MockupCategory = "resume" | "brand" | "planner" | "social" | "business";

const HANDLE_MAP: Record<string, MockupCategory> = {
  "resume-templates": "resume",
  "brand-kits": "brand",
  "digital-planners": "planner",
  "social-media": "social",
  "business-essentials": "business",
};

const TYPE_KEYWORDS: [RegExp, MockupCategory][] = [
  [/resume|cv|cover letter/i, "resume"],
  [/brand/i, "brand"],
  [/planner|journal|notebook/i, "planner"],
  [/social|instagram|carousel/i, "social"],
  [/business|proposal|invoice|pitch|deck|ledger/i, "business"],
];

/**
 * Resolves which category mockup a product should render when it has no real
 * photography. Prefers the product's collection handle (matches VELOURA's own
 * collection structure 1:1), then falls back to keyword-matching productType
 * so real Shopify catalogues with different taxonomy still get a sensible
 * mockup instead of a blank fallback.
 */
export function getMockupCategory(product: {
  productType?: string | null;
  collections?: { handle: string }[] | null;
}): MockupCategory {
  for (const collection of product.collections ?? []) {
    const mapped = HANDLE_MAP[collection.handle];
    if (mapped) return mapped;
  }

  const type = product.productType ?? "";
  for (const [pattern, category] of TYPE_KEYWORDS) {
    if (pattern.test(type)) return category;
  }

  return "business";
}
