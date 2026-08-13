import type { DigitalProductMeta, ShopifyProduct } from "@/types/shopify";
import { getMetafield } from "@/lib/utils";

/** Reads `veloura`-namespace metafields off a product into a typed digital-product summary. */
export function getDigitalProductMeta(product: ShopifyProduct): DigitalProductMeta {
  const metafields = product.metafields.filter(Boolean) as { key: string; value: string }[];

  const formats = getMetafield(metafields, "file_formats");
  const included = getMetafield(metafields, "included_files");

  return {
    fileFormats: formats ? formats.split(",").map((f) => f.trim()) : undefined,
    pageCount: getMetafield(metafields, "page_count"),
    canvaCompatible: getMetafield(metafields, "canva_compatible") === "true",
    editable: getMetafield(metafields, "editable") === "true",
    includedFiles: included ? included.split(",").map((f) => f.trim()) : undefined,
    license: getMetafield(metafields, "license"),
    instantDownload: getMetafield(metafields, "instant_download") !== "false",
  };
}
