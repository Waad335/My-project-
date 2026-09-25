import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { PromoCodesManager } from "@/components/admin/promo-codes-manager";
import { requireAdminPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage() {
  await requireAdminPage("promos.manage");
  const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <PromoCodesManager
      promoCodes={promoCodes.map((p) => ({
        id: p.id,
        code: p.code,
        type: p.type,
        value: toNumber(p.value),
        minOrderValue: p.minOrderValue ? toNumber(p.minOrderValue) : null,
        usageLimit: p.usageLimit,
        usedCount: p.usedCount,
        isActive: p.isActive,
      }))}
    />
  );
}
