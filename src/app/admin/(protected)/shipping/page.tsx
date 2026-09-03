import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { ShippingZonesManager } from "@/components/admin/shipping-zones-manager";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const zones = await prisma.shippingZone.findMany({ orderBy: { governorate: "asc" } });

  return (
    <ShippingZonesManager
      zones={zones.map((z) => ({
        id: z.id,
        governorate: z.governorate,
        governorateAr: z.governorateAr,
        fee: toNumber(z.fee),
        etaEn: z.etaEn,
        etaAr: z.etaAr,
        isCairo: z.isCairo,
        isActive: z.isActive,
      }))}
    />
  );
}
