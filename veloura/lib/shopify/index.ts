import { isShopifyConfigured, shopifyFetch } from "./client";
import {
  GET_COLLECTIONS_QUERY,
  GET_COLLECTION_PRODUCTS_QUERY,
  GET_COLLECTION_QUERY,
  GET_PRODUCTS_QUERY,
  GET_PRODUCT_QUERY,
  GET_PRODUCT_RECOMMENDATIONS_QUERY,
} from "./queries";
import { mockCollections, mockProducts } from "./mock-data";
import { transformCollection, transformProduct } from "./transforms";
import type {
  ProductFilterOptions,
  ShopifyCollection,
  ShopifyProduct,
} from "@/types/shopify";

export { isShopifyConfigured } from "./client";

const TAGS = { products: "products", collections: "collections", cart: "cart" };

/** Fetch a page of products, optionally filtered by a Storefront search query and sorted. */
export async function getProducts(options: ProductFilterOptions = {}): Promise<ShopifyProduct[]> {
  if (!isShopifyConfigured) {
    return filterMockProducts(mockProducts, options);
  }

  const queryParts: string[] = [];
  if (options.query) queryParts.push(options.query);
  if (options.collectionHandle) queryParts.push(`collection:${options.collectionHandle}`);

  const { data } = await shopifyFetch<{ products: { edges: { node: unknown }[] } }>({
    query: GET_PRODUCTS_QUERY,
    variables: {
      first: 100,
      query: queryParts.join(" ") || undefined,
      sortKey: options.sortKey === "PRICE" ? "PRICE" : options.sortKey ?? "RELEVANCE",
      reverse: options.reverse ?? false,
    },
    tags: [TAGS.products],
    revalidate: 60,
  });

  const products = (data?.products.edges ?? []).map((e) => transformProduct(e.node as never));
  return filterByPrice(products, options);
}

/** Fetch a single product by its URL handle. */
export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  if (!isShopifyConfigured) {
    return mockProducts.find((p) => p.handle === handle) ?? null;
  }

  const { data } = await shopifyFetch<{ product: unknown }>({
    query: GET_PRODUCT_QUERY,
    variables: { handle },
    tags: [TAGS.products],
    revalidate: 60,
  });

  if (!data?.product) return null;
  return transformProduct(data.product as never);
}

/** Fetch Shopify-suggested related products for a given product id. */
export async function getProductRecommendations(productId: string): Promise<ShopifyProduct[]> {
  if (!isShopifyConfigured) {
    return mockProducts.filter((p) => p.id !== productId).slice(0, 4);
  }

  const { data } = await shopifyFetch<{ productRecommendations: unknown[] }>({
    query: GET_PRODUCT_RECOMMENDATIONS_QUERY,
    variables: { productId },
    tags: [TAGS.products],
    revalidate: 60,
  });

  return (data?.productRecommendations ?? []).map((p) => transformProduct(p as never));
}

/** Fetch all collections. */
export async function getCollections(): Promise<ShopifyCollection[]> {
  if (!isShopifyConfigured) {
    return mockCollections;
  }

  const { data } = await shopifyFetch<{ collections: { edges: { node: unknown }[] } }>({
    query: GET_COLLECTIONS_QUERY,
    tags: [TAGS.collections],
    revalidate: 300,
  });

  return (data?.collections.edges ?? []).map((e) => transformCollection(e.node as never));
}

/** Fetch a single collection (without products) by handle. */
export async function getCollection(handle: string): Promise<ShopifyCollection | null> {
  if (!isShopifyConfigured) {
    return mockCollections.find((c) => c.handle === handle) ?? null;
  }

  const { data } = await shopifyFetch<{ collection: unknown }>({
    query: GET_COLLECTION_QUERY,
    variables: { handle },
    tags: [TAGS.collections],
    revalidate: 300,
  });

  if (!data?.collection) return null;
  return transformCollection(data.collection as never);
}

/** Fetch a collection along with its products. */
export async function getCollectionProducts(
  handle: string,
  options: Pick<ProductFilterOptions, "sortKey" | "reverse"> = {}
): Promise<{ collection: ShopifyCollection; products: ShopifyProduct[] } | null> {
  if (!isShopifyConfigured) {
    const collection = mockCollections.find((c) => c.handle === handle);
    if (!collection) return null;
    const products = mockProducts.filter((p) =>
      p.collections?.some((c) => c.handle === handle)
    );
    return { collection, products };
  }

  const { data } = await shopifyFetch<{ collection: unknown }>({
    query: GET_COLLECTION_PRODUCTS_QUERY,
    variables: {
      handle,
      first: 100,
      sortKey: options.sortKey ?? "COLLECTION_DEFAULT",
      reverse: options.reverse ?? false,
    },
    tags: [TAGS.collections, TAGS.products],
    revalidate: 60,
  });

  if (!data?.collection) return null;
  const collection = transformCollection(data.collection as never);
  return { collection, products: collection.products ?? [] };
}

function filterMockProducts(
  products: ShopifyProduct[],
  options: ProductFilterOptions
): ShopifyProduct[] {
  let results = products;

  if (options.collectionHandle) {
    results = results.filter((p) =>
      p.collections?.some((c) => c.handle === options.collectionHandle)
    );
  }

  if (options.query) {
    const q = options.query.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.productType.toLowerCase().includes(q)
    );
  }

  results = filterByPrice(results, options);

  if (options.sortKey === "PRICE") {
    results = [...results].sort((a, b) => {
      const diff = Number(a.priceRange.minVariantPrice.amount) - Number(b.priceRange.minVariantPrice.amount);
      return options.reverse ? -diff : diff;
    });
  } else if (options.sortKey === "TITLE") {
    results = [...results].sort((a, b) => {
      const diff = a.title.localeCompare(b.title);
      return options.reverse ? -diff : diff;
    });
  } else if (options.sortKey === "CREATED_AT") {
    results = [...results].sort((a, b) => {
      const diff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return options.reverse ? -diff : diff;
    });
  }

  return results;
}

function filterByPrice(products: ShopifyProduct[], options: ProductFilterOptions): ShopifyProduct[] {
  if (options.minPrice === undefined && options.maxPrice === undefined) return products;
  return products.filter((p) => {
    const price = Number(p.priceRange.minVariantPrice.amount);
    if (options.minPrice !== undefined && price < options.minPrice) return false;
    if (options.maxPrice !== undefined && price > options.maxPrice) return false;
    return true;
  });
}
