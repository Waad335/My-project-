import type {
  AccountDeletedResponse,
  AuthSessionResponse,
  CartResponse,
  CategoriesResponse,
  CategoryResponse,
  CheckoutResponse,
  HomeResponse,
  MeResponse,
  OrderResponse,
  OrdersResponse,
  PaymentMethod,
  ProductListResponse,
  ProductResponse,
  ProductSort,
  SearchSuggestResponse,
  SettingsResponse,
  ShippingQuoteResponse,
  ShippingZonesResponse,
  TokenResponse,
  WishlistResponse,
} from "@shared/api-types";
import type { ApiClient } from "./client";

// Typed calls for every /api/mobile/v1 endpoint (docs/mobile/API.md).
// Response types come straight from the server's contract file.

export type ProductListParams = {
  q?: string;
  category?: string;
  sub?: string;
  sort?: ProductSort;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
};

export type RegisterInput = { name: string; email: string; phone?: string; password: string };
export type LoginInput = { email: string; password: string };
export type ProfileInput = { name: string; phone?: string };
export type ChangePasswordInput = { currentPassword: string; newPassword: string; confirm: string };
export type SavedCartLine = { productId: string; variantId: string | null; quantity: number };

export type CheckoutInput = {
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  governorate: string;
  city: string;
  address: string;
  buildingInfo?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  promoCode?: string;
  items: { productId: string; variantId?: string | null; quantity: number }[];
};

// The two website endpoints the app reuses keep the website's shapes.
export type PromoValidateResponse = { valid: boolean; code?: string; discountAmount?: number; message?: string };
export type OrderLookupResponse = {
  found: boolean;
  order?: {
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
    shippingMethodLabel: string;
    items: { nameEn: string; nameAr: string; quantity: number; lineTotal: number }[];
  };
};
export type ForgotPasswordResponse = { ok: true; code: "resetEmailSent"; message: string };

export function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

const segment = (value: string) => encodeURIComponent(value);

export function createEndpoints(client: ApiClient) {
  const { request } = client;
  return {
    // Catalog (public)
    getHome: () => request<HomeResponse>("/home"),
    getCategories: () => request<CategoriesResponse>("/categories"),
    getCategory: (slug: string) => request<CategoryResponse>(`/categories/${segment(slug)}`),
    listProducts: (params: ProductListParams = {}) => request<ProductListResponse>(`/products${queryString(params)}`),
    getProduct: (slug: string) => request<ProductResponse>(`/products/${segment(slug)}`),
    searchSuggest: (q: string) => request<SearchSuggestResponse>(`/search/suggest${queryString({ q })}`),

    // Store settings and shipping (public)
    getSettings: () => request<SettingsResponse>("/settings"),
    getShippingZones: () => request<ShippingZonesResponse>("/shipping/zones"),
    quoteShipping: (governorate: string, subtotal: number) =>
      request<ShippingQuoteResponse>("/shipping/quote", { method: "POST", body: { governorate, subtotal } }),
    validatePromo: (code: string, subtotal: number) =>
      request<PromoValidateResponse>("/promo/validate", { method: "POST", body: { code, subtotal } }),
    lookupOrder: (orderNumber: string, phone: string) =>
      request<OrderLookupResponse>("/orders/lookup", { method: "POST", body: { orderNumber, phone } }),

    // Accounts
    register: (input: RegisterInput) => request<AuthSessionResponse>("/auth/register", { method: "POST", body: input }),
    login: (input: LoginInput) => request<AuthSessionResponse>("/auth/login", { method: "POST", body: input }),
    forgotPassword: (email: string) =>
      request<ForgotPasswordResponse>("/auth/forgot-password", { method: "POST", body: { email } }),
    getMe: () => request<MeResponse>("/me", { auth: "required" }),
    updateMe: (input: ProfileInput) => request<MeResponse>("/me", { method: "PATCH", body: input, auth: "required" }),
    changePassword: (input: ChangePasswordInput) =>
      request<TokenResponse>("/me/password", { method: "POST", body: input, auth: "required" }),
    deleteAccount: (password: string) =>
      request<AccountDeletedResponse>("/me", { method: "DELETE", body: { password }, auth: "required" }),

    // Saved cart and wishlist
    getCart: () => request<CartResponse>("/me/cart", { auth: "required" }),
    saveCart: (items: SavedCartLine[]) => request<CartResponse>("/me/cart", { method: "PUT", body: { items }, auth: "required" }),
    getWishlist: () => request<WishlistResponse>("/me/wishlist", { auth: "required" }),
    saveWishlist: (productIds: string[]) =>
      request<WishlistResponse>("/me/wishlist", { method: "PUT", body: { productIds }, auth: "required" }),

    // Orders and checkout (a signed-in customer's order is linked to the account)
    listOrders: () => request<OrdersResponse>("/me/orders", { auth: "required" }),
    getOrder: (orderNumber: string) => request<OrderResponse>(`/me/orders/${segment(orderNumber)}`, { auth: "required" }),
    checkout: (input: CheckoutInput) =>
      request<CheckoutResponse>("/checkout", { method: "POST", body: input, auth: "optional" }),
  };
}

export type Endpoints = ReturnType<typeof createEndpoints>;
