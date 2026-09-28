import { listActiveShippingZones } from "@/lib/shipping";
import { getSiteSettings } from "@/lib/settings";
import { toNumber } from "@/lib/utils";
import { apiJson, mobileRoute } from "@/lib/mobile/http";
import type { ShippingZonesResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// Governorates the store delivers to, with their fees and delivery times.
export const GET = mobileRoute(async () => {
  const [zones, settings] = await Promise.all([listActiveShippingZones(), getSiteSettings()]);
  const body: ShippingZonesResponse = {
    zones: zones.map((z) => ({
      governorate: z.governorate,
      governorateAr: z.governorateAr,
      fee: toNumber(z.fee),
      etaEn: z.etaEn,
      etaAr: z.etaAr,
      isCairo: z.isCairo,
    })),
    freeShippingThreshold: settings.freeShippingThreshold ? toNumber(settings.freeShippingThreshold) : null,
  };
  return apiJson(body, { cache: "public" });
});
