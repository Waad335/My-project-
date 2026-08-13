import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(amount: string | number, currencyCode: string = "USD"): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function getMetafield(
  metafields: { key: string; value: string }[] | undefined,
  key: string
): string | undefined {
  return metafields?.find((m) => m?.key === key)?.value;
}
