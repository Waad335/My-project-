/**
 * Conservative, deterministic detection of price and category from an
 * Instagram caption. No LLM call, no guessing beyond explicit keyword/format
 * matches — anything ambiguous is left blank and flagged for admin review,
 * per the "never invent a price, never guess a category" requirement.
 */

const PRICE_PATTERNS: RegExp[] = [
  // "Price: 170" / "السعر 170" / "سعر: 170"
  /(?:price|السعر|سعر)\s*[:\-]?\s*(\d{2,6}(?:[.,]\d{1,2})?)/i,
  // "170 EGP" / "170 LE" / "170 L.E." / "170 L.E"
  /(\d{2,6}(?:[.,]\d{1,2})?)\s*(?:egp|l\.?e\.?)(?![a-z])/i,
  // "170 جنيه" / "170 جنيهًا" / "170 ج.م"
  /(\d{2,6}(?:[.,]\d{1,2})?)\s*(?:جنيه(?:ا|ًا)?|ج\.م)/,
];

export type PriceDetectionResult = { priceEGP: number | null; needsReview: boolean };

export function detectPriceEGP(caption: string | null | undefined): PriceDetectionResult {
  if (!caption) return { priceEGP: null, needsReview: true };

  for (const pattern of PRICE_PATTERNS) {
    const match = caption.match(pattern);
    if (match?.[1]) {
      const value = Number.parseFloat(match[1].replace(",", "."));
      if (Number.isFinite(value) && value > 0) {
        return { priceEGP: value, needsReview: false };
      }
    }
  }

  return { priceEGP: null, needsReview: true };
}

// Only the 5 real DODANA categories — deliberately no "clothing/fashion" or
// any other catch-all, per the business rule that those aren't valid here.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  skincare: [
    "skincare",
    "skin care",
    "serum",
    "cleanser",
    "moisturizer",
    "moisturiser",
    "sunscreen",
    "spf",
    "toner",
    "بشرة",
    "سيروم",
    "غسول",
    "كريم",
    "واقي شمس",
    "تونر",
  ],
  haircare: [
    "haircare",
    "hair care",
    "shampoo",
    "conditioner",
    "hair oil",
    "hair mask",
    "شعر",
    "شامبو",
    "بلسم",
    "زيت شعر",
    "ماسك شعر",
  ],
  perfumes: [
    "perfume",
    "fragrance",
    "eau de parfum",
    "edp",
    "body mist",
    "musk",
    "cologne",
    "عطر",
    "عطور",
    "مسك",
    "بودي ميست",
  ],
  accessories: [
    "necklace",
    "earring",
    "earrings",
    "bracelet",
    "ring",
    "hair clip",
    "hair accessory",
    "jewelry",
    "jewellery",
    "إكسسوار",
    "قلادة",
    "حلق",
    "أسورة",
    "خاتم",
    "مشبك",
  ],
  bags: ["bag", "tote", "purse", "handbag", "crossbody", "clutch", "شنطة", "شنط", "حقيبة"],
};

export type CategoryDetectionResult = { categorySlug: string | null; needsReview: boolean };

export function detectCategorySlug(caption: string | null | undefined): CategoryDetectionResult {
  if (!caption) return { categorySlug: null, needsReview: true };
  const lower = caption.toLowerCase();

  const scores = Object.entries(CATEGORY_KEYWORDS).map(([slug, keywords]) => {
    const score = keywords.reduce((count, kw) => (lower.includes(kw.toLowerCase()) ? count + 1 : count), 0);
    return { slug, score };
  });

  const withHits = scores.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (withHits.length === 0) return { categorySlug: null, needsReview: true };

  // Ambiguous — two categories tied for the top score — don't guess.
  if (withHits.length > 1 && withHits[0]!.score === withHits[1]!.score) {
    return { categorySlug: null, needsReview: true };
  }

  return { categorySlug: withHits[0]!.slug, needsReview: false };
}

/**
 * A short product-name guess from the caption's first line/sentence, purely
 * as a starting point for the admin to edit — never shown as a finished
 * product name without review.
 */
export function detectProductName(caption: string | null | undefined): string | null {
  if (!caption) return null;
  const firstLine = caption.split(/\r?\n/)[0]?.trim() ?? "";
  const withoutHashtags = firstLine.replace(/#\S+/g, "").trim();
  const withoutEmoji = withoutHashtags.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
  const cleaned = withoutEmoji.replace(/\s{2,}/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.length > 80 ? `${cleaned.slice(0, 77)}...` : cleaned;
}
