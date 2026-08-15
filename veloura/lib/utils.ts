import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Deterministic string hash used to derive stable pseudo-random visual variation from a seed (product handle, etc). */
export function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
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
