import type { ProductCard, ProductDetail, ProductVariant, SettingsResponse } from "@shared/api-types";

// Small, readable catalogue fixtures shaped exactly like the API contract.

export function card(overrides: Partial<ProductCard> = {}): ProductCard {
  return {
    id: "p1",
    slug: "rose-serum",
    sku: "DOD-SKN-001",
    nameEn: "Rose Serum",
    nameAr: "سيروم الورد",
    price: 500,
    oldPrice: null,
    salePrice: null,
    effectivePrice: 500,
    image: "https://example.test/rose.jpg",
    hoverImage: null,
    imageAltEn: null,
    imageAltAr: null,
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    availability: "IN_STOCK",
    stock: 25,
    trackStock: true,
    ratingAvg: 0,
    ratingCount: 0,
    categorySlug: "skincare",
    categoryNameEn: "Skincare",
    categoryNameAr: "العناية بالبشرة",
    subcategorySlug: null,
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

export function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return { id: "v1", sku: "DOD-V1", color: null, colorHex: null, size: null, priceDelta: 0, stock: 5, isDefault: false, ...overrides };
}

export function detail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    ...card(),
    model3dUrl: null,
    subcategoryNameEn: null,
    subcategoryNameAr: null,
    descriptionEn: "A gentle rose serum.",
    descriptionAr: "سيروم ورد لطيف.",
    ingredientsEn: null,
    ingredientsAr: null,
    warningsEn: null,
    warningsAr: null,
    images: [{ url: "https://example.test/rose.jpg", altEn: null, altAr: null }],
    variants: [],
    reviews: [],
    ...overrides,
  };
}

export function settings(overrides: Partial<SettingsResponse> = {}): SettingsResponse {
  return {
    paymentMethods: ["COD"],
    freeShippingThreshold: null,
    whatsappNumber: "+200000000000",
    whatsappGroupUrl: null,
    instagramUrl: "https://instagram.com/example",
    tiktokUrl: "https://tiktok.com/@example",
    announcementEn: null,
    announcementAr: null,
    returnsPolicyEn: "Returns within 14 days.",
    returnsPolicyAr: "الاسترجاع خلال 14 يوم.",
    siteUrl: "https://example.test",
    ...overrides,
  };
}
