import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

export type ShippingQuote = {
  governorate: string;
  fee: number;
  isCairo: boolean;
  etaEn: string;
  etaAr: string;
  freeShippingApplied: boolean;
};

/**
 * Modular shipping calculation. Fees live in the `shipping_zones` table and
 * are fully editable from Admin > Shipping — nothing here is hardcoded.
 * A courier integration (Cairo courier, national courier company, etc.) can
 * later be plugged in by extending this module without touching checkout UI.
 */
export async function getShippingQuote(
  governorate: string,
  subtotal: number
): Promise<ShippingQuote> {
  const zone = await prisma.shippingZone.findFirst({
    where: { governorate: { equals: governorate, mode: "insensitive" }, isActive: true },
  });

  const settings = await prisma.siteSettings.findUnique({ where: { id: "settings" } });
  const freeThreshold = settings?.freeShippingThreshold ? toNumber(settings.freeShippingThreshold) : null;

  if (!zone) {
    // Fallback zone if a governorate hasn't been configured yet — keeps
    // checkout from breaking while still being obviously a default.
    return {
      governorate,
      fee: 0,
      isCairo: false,
      etaEn: "Fast delivery across Egypt",
      etaAr: "توصيل سريع لكل مصر",
      freeShippingApplied: false,
    };
  }

  const freeShippingApplied = freeThreshold !== null && subtotal >= freeThreshold;

  return {
    governorate: zone.governorate,
    fee: freeShippingApplied ? 0 : toNumber(zone.fee),
    isCairo: zone.isCairo,
    etaEn: zone.etaEn,
    etaAr: zone.etaAr,
    freeShippingApplied,
  };
}

export async function listActiveShippingZones() {
  return prisma.shippingZone.findMany({
    where: { isActive: true },
    orderBy: { governorate: "asc" },
  });
}
