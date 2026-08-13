// Shopify Storefront API domain types.
// These mirror the (subset of) fields VELOURA queries from the Storefront GraphQL API.

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyPriceRange {
  minVariantPrice: ShopifyMoney;
  maxVariantPrice: ShopifyMoney;
}

export interface ShopifySelectedOption {
  name: string;
  value: string;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: ShopifySelectedOption[];
  image: ShopifyImage | null;
}

export interface ShopifyProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface ShopifyMetafield {
  key: string;
  namespace: string;
  value: string;
  type: string;
}

export interface ShopifySeo {
  title: string | null;
  description: string | null;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  featuredImage: ShopifyImage | null;
  images: ShopifyImage[];
  priceRange: ShopifyPriceRange;
  compareAtPriceRange: ShopifyPriceRange | null;
  options: ShopifyProductOption[];
  variants: ShopifyProductVariant[];
  tags: string[];
  productType: string;
  vendor: string;
  seo: ShopifySeo;
  metafields: (ShopifyMetafield | null)[];
  collections?: { handle: string; title: string }[];
  updatedAt: string;
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  image: ShopifyImage | null;
  seo: ShopifySeo;
  products?: ShopifyProduct[];
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  cost: {
    totalAmount: ShopifyMoney;
    amountPerQuantity?: ShopifyMoney;
  };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: ShopifySelectedOption[];
    image: ShopifyImage | null;
    product: {
      handle: string;
      title: string;
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
    totalTaxAmount: ShopifyMoney | null;
  };
  lines: ShopifyCartLine[];
}

export interface ProductFilterOptions {
  query?: string;
  collectionHandle?: string;
  sortKey?: "RELEVANCE" | "PRICE" | "TITLE" | "CREATED_AT" | "BEST_SELLING";
  reverse?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Digital-product metadata VELOURA expects to be set via Shopify metafields
 * (namespace: `veloura`). All optional — the UI degrades gracefully when unset.
 */
export interface DigitalProductMeta {
  fileFormats?: string[];
  pageCount?: string;
  canvaCompatible?: boolean;
  editable?: boolean;
  includedFiles?: string[];
  license?: string;
  instantDownload?: boolean;
}
