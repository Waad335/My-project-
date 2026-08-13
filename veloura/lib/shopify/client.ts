import "server-only";

const API_VERSION = "2025-01";

const domain = process.env.SHOPIFY_STORE_DOMAIN ?? process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

export const isShopifyConfigured = Boolean(domain && storefrontToken);

const endpoint = domain
  ? `https://${domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/api/${API_VERSION}/graphql.json`
  : "";

export class ShopifyApiError extends Error {
  constructor(message: string, public readonly errors?: unknown) {
    super(message);
    this.name = "ShopifyApiError";
  }
}

/**
 * Thin, typed fetch wrapper around the Shopify Storefront GraphQL API.
 * Credentials are read from server-only env vars and never reach the client bundle.
 */
export async function shopifyFetch<TData>({
  query,
  variables,
  cache = "force-cache",
  tags,
  revalidate,
}: {
  query: string;
  variables?: Record<string, unknown>;
  cache?: RequestCache;
  tags?: string[];
  revalidate?: number | false;
}): Promise<{ data: TData | null; errors?: unknown }> {
  if (!isShopifyConfigured) {
    return { data: null, errors: "shopify-not-configured" };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken as string,
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      ...(revalidate !== undefined
        ? { next: { revalidate, tags } }
        : { cache, next: tags ? { tags } : undefined }),
    });

    const json = await res.json();

    if (json.errors) {
      throw new ShopifyApiError("Shopify Storefront API returned errors", json.errors);
    }

    if (!res.ok) {
      throw new ShopifyApiError(`Shopify Storefront API request failed: ${res.status}`);
    }

    return { data: json.data as TData };
  } catch (error) {
    if (error instanceof ShopifyApiError) throw error;
    throw new ShopifyApiError("Failed to reach Shopify Storefront API", error);
  }
}
