import type {
  ShopifyCart,
  ShopifyCollection,
  ShopifyProduct,
} from "@/types/shopify";

type Edge<T> = { node: T };
type Connection<T> = { edges: Edge<T>[] };

function flatten<T>(connection: Connection<T> | null | undefined): T[] {
  return connection?.edges?.map((edge) => edge.node) ?? [];
}

// Raw shapes as returned directly by the Storefront API (snake-free, edge/node wrapped).
type RawProduct = Omit<
  ShopifyProduct,
  "images" | "variants" | "options" | "collections"
> & {
  images: Connection<ShopifyProduct["images"][number]>;
  variants: Connection<ShopifyProduct["variants"][number]>;
  options: { id: string; name: string; optionValues: { name: string }[] }[];
  collections?: Connection<{ handle: string; title: string }>;
};

export function transformProduct(raw: RawProduct): ShopifyProduct {
  return {
    ...raw,
    images: flatten(raw.images),
    variants: flatten(raw.variants),
    options: raw.options.map((option) => ({
      id: option.id,
      name: option.name,
      values: option.optionValues.map((v) => v.name),
    })),
    collections: raw.collections ? flatten(raw.collections) : undefined,
  };
}

type RawCollection = Omit<ShopifyCollection, "products"> & {
  products?: Connection<RawProduct>;
};

export function transformCollection(raw: RawCollection): ShopifyCollection {
  return {
    ...raw,
    products: raw.products ? flatten(raw.products).map(transformProduct) : undefined,
  };
}

type RawCart = Omit<ShopifyCart, "lines"> & {
  lines: Connection<ShopifyCart["lines"][number]>;
};

export function transformCart(raw: RawCart): ShopifyCart {
  return {
    ...raw,
    lines: flatten(raw.lines),
  };
}
