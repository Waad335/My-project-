// Response contract of the Dodana mobile API v1 (/api/mobile/v1). Types only,
// with no runtime imports, so the Expo app can import this file as-is.
// Changing a shape here is a breaking change for installed app versions:
// add fields freely, but never remove or retype one within v1.
//
// Conventions:
// - Every name/description comes in both languages (…En / …Ar); the app
//   picks one by its current language.
// - Every image/media URL is absolute.
// - Money is a number in EGP.
// - Errors: { error: { code, message, fieldErrors? } }. `code` and each
//   fieldErrors value are the website's translation keys
//   (src/messages/*.json → account.errors.*, or an API code listed in
//   docs/mobile/API.md); `message` is ready to show, in the request locale.

export type ApiErrorBody = {
  error: { code: string; message: string; fieldErrors?: Record<string, string> };
};

// ── Catalog ────────────────────────────────────────────────────────────
export type ProductCard = {
  id: string;
  slug: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  price: number;
  oldPrice: number | null;
  salePrice: number | null;
  effectivePrice: number;
  image: string | null;
  hoverImage: string | null;
  imageAltEn: string | null;
  imageAltAr: string | null;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  availability: string;
  stock: number;
  trackStock: boolean;
  ratingAvg: number;
  ratingCount: number;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameAr: string;
  subcategorySlug: string | null;
  createdAt: string;
};

export type ProductVariant = {
  id: string;
  sku: string;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  priceDelta: number;
  stock: number;
  isDefault: boolean;
};

export type ProductDetail = ProductCard & {
  model3dUrl: string | null;
  subcategoryNameEn: string | null;
  subcategoryNameAr: string | null;
  descriptionEn: string;
  descriptionAr: string;
  ingredientsEn: string | null;
  ingredientsAr: string | null;
  warningsEn: string | null;
  warningsAr: string | null;
  images: { url: string; altEn: string | null; altAr: string | null }[];
  variants: ProductVariant[];
  reviews: { id: string; authorName: string; rating: number; comment: string; isDemo: boolean; createdAt: string }[];
};

export type ShopCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  image: string | null;
  productCount: number;
};

export type Subcategory = { id: string; slug: string; nameEn: string; nameAr: string };

export type Department = { id: string; slug: string; nameEn: string; nameAr: string; subcategories: Subcategory[] };

export type ShowcaseItem = {
  id: string;
  kind: "product" | "category";
  slug: string;
  nameEn: string;
  nameAr: string;
  image: string;
  modelUrl: string | null;
};

export type HomeResponse = {
  showcase: ShowcaseItem[];
  shopCategories: ShopCategory[];
  departments: Department[];
  featured: ProductCard[];
  newArrivals: ProductCard[];
  bestSellers: ProductCard[];
};

export type CategoriesResponse = { shopCategories: ShopCategory[]; departments: Department[] };

export type CategoryResponse = {
  category: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    descriptionEn: string | null;
    descriptionAr: string | null;
    image: string | null;
    subcategories: Subcategory[];
  };
};

export const PRODUCT_SORTS = ["featured", "newest", "price-asc", "price-desc", "rating"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export type ProductListResponse = {
  products: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type ProductResponse = { product: ProductDetail; related: ProductCard[] };

export type SearchSuggestResponse = { products: ProductCard[] };

// ── Store settings & shipping ──────────────────────────────────────────
export type PaymentMethod = "COD";

export type SettingsResponse = {
  // Payment methods this app version can use (v1: cash on delivery only,
  // and only while the store has it enabled).
  paymentMethods: PaymentMethod[];
  freeShippingThreshold: number | null;
  whatsappNumber: string;
  whatsappGroupUrl: string | null;
  instagramUrl: string;
  tiktokUrl: string;
  announcementEn: string | null;
  announcementAr: string | null;
  returnsPolicyEn: string;
  returnsPolicyAr: string;
  siteUrl: string;
};

export type ShippingZone = {
  governorate: string;
  governorateAr: string;
  fee: number;
  etaEn: string;
  etaAr: string;
  isCairo: boolean;
};

export type ShippingZonesResponse = { zones: ShippingZone[]; freeShippingThreshold: number | null };

export type ShippingQuoteResponse = {
  governorate: string;
  fee: number;
  isCairo: boolean;
  etaEn: string;
  etaAr: string;
  freeShippingApplied: boolean;
};

// ── Accounts ───────────────────────────────────────────────────────────
export type MobileCustomer = { id: string; email: string; name: string; phone: string | null; createdAt: string };

export type AuthSessionResponse = { token: string; tokenType: "Bearer"; expiresAt: string; customer: MobileCustomer };

export type MeResponse = { customer: MobileCustomer };

export type TokenResponse = { token: string; tokenType: "Bearer"; expiresAt: string };

export type AccountDeletedResponse = { deleted: true; ordersRetained: number };

export type SavedCartItem = {
  productId: string;
  variantId: string | null;
  slug: string;
  nameEn: string;
  nameAr: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  variantLabel: string | null;
  maxStock: number;
};

export type SavedWishlistItem = { productId: string; slug: string; nameEn: string; nameAr: string; image: string | null; price: number };

export type CartResponse = { cart: SavedCartItem[] };
export type WishlistResponse = { wishlist: SavedWishlistItem[] };

// ── Orders ─────────────────────────────────────────────────────────────
export type OrderItem = {
  productId: string | null;
  productSlug: string | null;
  nameEn: string;
  nameAr: string;
  sku: string;
  image: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderSummary = {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  itemCount: number;
  items: OrderItem[];
};

export type OrderDetail = OrderSummary & {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  delivery: {
    name: string;
    phone: string;
    whatsapp: string | null;
    email: string | null;
    governorate: string;
    city: string;
    address: string;
    buildingInfo: string | null;
    methodLabel: string;
    isCairo: boolean;
  };
  customerNotes: string | null;
};

export type OrdersResponse = { orders: OrderSummary[] };
export type OrderResponse = { order: OrderDetail };

export type CheckoutResponse = {
  orderNumber: string;
  total: number;
  paymentMethod: PaymentMethod;
  status: string;
  linkedToAccount: boolean;
};
