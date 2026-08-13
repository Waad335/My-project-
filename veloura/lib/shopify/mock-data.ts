import type { ShopifyCollection, ShopifyProduct } from "@/types/shopify";

/**
 * Local demo catalogue used only when Shopify credentials are absent
 * (`isShopifyConfigured === false`). This lets the storefront render fully
 * without a live store — ideal for local development and previews before
 * a real Shopify backend is connected. See README "Connecting Shopify".
 */

const money = (amount: string) => ({ amount, currencyCode: "USD" });

function metafield(key: string, value: string, type = "single_line_text_field") {
  return { namespace: "veloura", key, value, type };
}

interface MockSeed {
  handle: string;
  title: string;
  productType: string;
  price: string;
  compareAt?: string;
  description: string;
  collectionHandles: string[];
  tags?: string[];
  formats?: string[];
  pages?: string;
  canva?: boolean;
  editable?: boolean;
  files?: string[];
}

const seeds: MockSeed[] = [
  {
    handle: "atelier-resume-template",
    title: "Atelier Resume Template",
    productType: "Resume Templates",
    price: "38.00",
    compareAt: "52.00",
    description:
      "A quietly confident resume system built on a refined type grid, designed to read effortlessly at a glance and hold up under scrutiny in any industry.",
    collectionHandles: ["resume-templates"],
    tags: ["bestseller", "editable"],
    formats: ["Canva", "PDF", "DOCX"],
    pages: "2 pages + cover",
    canva: true,
    editable: true,
    files: ["Resume.pdf", "Resume-Editable.canva", "Cover-Letter.docx", "Font-Guide.pdf"],
  },
  {
    handle: "maison-cover-letter-suite",
    title: "Maison Cover Letter Suite",
    productType: "Cover Letter Templates",
    price: "24.00",
    description:
      "A companion letter template engineered to pair with any VELOURA resume — same grid, same restraint, tuned for a confident first impression.",
    collectionHandles: ["resume-templates"],
    formats: ["Canva", "PDF"],
    pages: "1 page",
    canva: true,
    editable: true,
    files: ["Cover-Letter.pdf", "Cover-Letter-Editable.canva"],
  },
  {
    handle: "reverie-brand-kit",
    title: "Reverie Brand Kit",
    productType: "Brand Kits",
    price: "128.00",
    compareAt: "168.00",
    description:
      "A complete visual identity starter kit — logo lockups, color system, type pairing, and social templates — built for founders who want to look established on day one.",
    collectionHandles: ["brand-kits"],
    tags: ["bestseller"],
    formats: ["Canva", "AI", "PNG"],
    pages: "32 assets",
    canva: true,
    editable: true,
    files: ["Logo-Suite.ai", "Brand-Guidelines.pdf", "Social-Templates.canva", "Color-Palette.pdf"],
  },
  {
    handle: "solace-daily-planner",
    title: "Solace Daily Planner",
    productType: "Digital Planners",
    price: "22.00",
    description:
      "An undated, hyperlinked digital planner for GoodNotes and Notability — built around gentle structure rather than rigid productivity dogma.",
    collectionHandles: ["digital-planners"],
    formats: ["PDF", "GoodNotes"],
    pages: "148 pages",
    canva: false,
    editable: false,
    files: ["Solace-Planner.pdf", "Setup-Guide.pdf"],
  },
  {
    handle: "quiet-hours-weekly-planner",
    title: "Quiet Hours Weekly Planner",
    productType: "Digital Planners",
    price: "18.00",
    description:
      "A minimal weekly spread designed for people who think in lists — undated, endlessly reusable, and built to disappear into your routine.",
    collectionHandles: ["digital-planners"],
    formats: ["PDF", "GoodNotes"],
    pages: "54 pages",
    canva: false,
    editable: false,
    files: ["Quiet-Hours.pdf"],
  },
  {
    handle: "editorial-social-kit",
    title: "Editorial Social Kit",
    productType: "Social Media Templates",
    price: "34.00",
    description:
      "Sixty editorial-grade social templates for the brand that refuses to look like everyone else's grid — quote cards, carousels, and story frames included.",
    collectionHandles: ["social-media"],
    tags: ["new"],
    formats: ["Canva"],
    pages: "60 templates",
    canva: true,
    editable: true,
    files: ["Editorial-Social-Kit.canva", "Usage-Guide.pdf"],
  },
  {
    handle: "atelier-carousel-pack",
    title: "Atelier Carousel Pack",
    productType: "Social Media Templates",
    price: "29.00",
    description:
      "A twelve-slide carousel system tuned for thought leadership posts — generous margins, considered hierarchy, nothing shouting for attention.",
    collectionHandles: ["social-media"],
    formats: ["Canva", "Figma"],
    pages: "12 slides",
    canva: true,
    editable: true,
    files: ["Carousel-Pack.canva", "Carousel-Pack.fig"],
  },
  {
    handle: "founders-proposal-template",
    title: "Founder's Proposal Template",
    productType: "Business Essentials",
    price: "42.00",
    description:
      "A client proposal template built to close — clear scope, pricing, and terms sections wrapped in typography that signals you take the work seriously.",
    collectionHandles: ["business-essentials"],
    formats: ["Canva", "PDF", "PPTX"],
    pages: "14 pages",
    canva: true,
    editable: true,
    files: ["Proposal.pptx", "Proposal-Editable.canva"],
  },
  {
    handle: "ledger-invoice-set",
    title: "Ledger Invoice Set",
    productType: "Business Essentials",
    price: "19.00",
    description:
      "A restrained invoice and receipt template pair, formatted for freelancers who want their paperwork to look as considered as their work.",
    collectionHandles: ["business-essentials"],
    formats: ["Canva", "PDF", "XLSX"],
    pages: "3 templates",
    canva: true,
    editable: true,
    files: ["Invoice.pdf", "Invoice-Editable.canva", "Ledger.xlsx"],
  },
  {
    handle: "grayscale-pitch-deck",
    title: "Grayscale Pitch Deck",
    productType: "Business Essentials",
    price: "58.00",
    compareAt: "76.00",
    description:
      "A twenty-slide investor deck template built on a strict grayscale-and-gold system, designed to make your numbers the loudest thing in the room.",
    collectionHandles: ["business-essentials"],
    tags: ["bestseller"],
    formats: ["Canva", "PPTX", "Keynote"],
    pages: "20 slides",
    canva: true,
    editable: true,
    files: ["Pitch-Deck.pptx", "Pitch-Deck.key", "Pitch-Deck.canva"],
  },
  {
    handle: "linen-resume-template",
    title: "Linen Resume Template",
    productType: "Resume Templates",
    price: "34.00",
    description:
      "A softer, warmer take on the modern resume — generous whitespace, a single accent rule, and a layout that scans clean on screen or in print.",
    collectionHandles: ["resume-templates"],
    tags: ["new"],
    formats: ["Canva", "PDF"],
    pages: "2 pages",
    canva: true,
    editable: true,
    files: ["Linen-Resume.pdf", "Linen-Resume.canva"],
  },
  {
    handle: "atelier-brand-board",
    title: "Atelier Brand Board Set",
    productType: "Brand Kits",
    price: "64.00",
    description:
      "Six moodboard-style brand board layouts for presenting a visual identity to clients — pair with any VELOURA brand kit or use standalone.",
    collectionHandles: ["brand-kits"],
    formats: ["Canva", "PDF"],
    pages: "6 boards",
    canva: true,
    editable: true,
    files: ["Brand-Boards.canva"],
  },
];

export const mockCollections: ShopifyCollection[] = [
  {
    id: "gid://mock/Collection/resume-templates",
    handle: "resume-templates",
    title: "Resume Templates",
    description:
      "Considered layouts that let a career speak for itself — built for ambitious professionals who notice the details.",
    descriptionHtml:
      "<p>Considered layouts that let a career speak for itself — built for ambitious professionals who notice the details.</p>",
    image: null,
    seo: { title: null, description: null },
  },
  {
    id: "gid://mock/Collection/brand-kits",
    handle: "brand-kits",
    title: "Brand Kits",
    description: "Complete identity systems for founders who want to look established from day one.",
    descriptionHtml: "<p>Complete identity systems for founders who want to look established from day one.</p>",
    image: null,
    seo: { title: null, description: null },
  },
  {
    id: "gid://mock/Collection/digital-planners",
    handle: "digital-planners",
    title: "Digital Planners",
    description: "Structure without noise — planners built to disappear into your routine.",
    descriptionHtml: "<p>Structure without noise — planners built to disappear into your routine.</p>",
    image: null,
    seo: { title: null, description: null },
  },
  {
    id: "gid://mock/Collection/social-media",
    handle: "social-media",
    title: "Social Media Templates",
    description: "Editorial-grade templates for the brand that refuses to look like everyone else's grid.",
    descriptionHtml: "<p>Editorial-grade templates for the brand that refuses to look like everyone else's grid.</p>",
    image: null,
    seo: { title: null, description: null },
  },
  {
    id: "gid://mock/Collection/business-essentials",
    handle: "business-essentials",
    title: "Business Essentials",
    description: "Proposals, invoices, and decks formatted for people who take the work seriously.",
    descriptionHtml: "<p>Proposals, invoices, and decks formatted for people who take the work seriously.</p>",
    image: null,
    seo: { title: null, description: null },
  },
];

export const mockProducts: ShopifyProduct[] = seeds.map((seed, index) => {
  const priceMoney = money(seed.price);
  const compareMoney = seed.compareAt ? money(seed.compareAt) : null;
  const metafields = [
    seed.formats ? metafield("file_formats", seed.formats.join(", ")) : null,
    seed.pages ? metafield("page_count", seed.pages) : null,
    metafield("canva_compatible", String(Boolean(seed.canva)), "boolean"),
    metafield("editable", String(Boolean(seed.editable)), "boolean"),
    seed.files ? metafield("included_files", seed.files.join(", ")) : null,
    metafield("license", "Single-user commercial license"),
    metafield("instant_download", "true", "boolean"),
  ];

  return {
    id: `gid://mock/Product/${index + 1}`,
    handle: seed.handle,
    title: seed.title,
    description: seed.description,
    descriptionHtml: `<p>${seed.description}</p>`,
    availableForSale: true,
    featuredImage: null,
    images: [],
    priceRange: { minVariantPrice: priceMoney, maxVariantPrice: priceMoney },
    compareAtPriceRange: compareMoney
      ? { minVariantPrice: compareMoney, maxVariantPrice: compareMoney }
      : null,
    options: [{ id: `opt-${index}`, name: "Title", values: ["Default"] }],
    variants: [
      {
        id: `gid://mock/ProductVariant/${index + 1}`,
        title: "Default",
        availableForSale: true,
        quantityAvailable: 999,
        price: priceMoney,
        compareAtPrice: compareMoney,
        selectedOptions: [{ name: "Title", value: "Default" }],
        image: null,
      },
    ],
    tags: seed.tags ?? [],
    productType: seed.productType,
    vendor: "VELOURA",
    seo: { title: null, description: null },
    metafields,
    collections: seed.collectionHandles.map((handle) => ({
      handle,
      title: mockCollections.find((c) => c.handle === handle)?.title ?? handle,
    })),
    updatedAt: new Date().toISOString(),
  };
});
