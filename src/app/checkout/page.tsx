import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { toNumber } from "@/lib/utils";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");
  const [zones, settings] = await Promise.all([
    prisma.shippingZone.findMany({ where: { isActive: true }, orderBy: { governorate: "asc" } }),
    getSiteSettings(),
  ]);

  return (
    <div className="container-dodana py-10">
      <h1 className="mb-8 font-heading text-3xl text-mocha-700">{t("title")}</h1>
      <CheckoutForm
        zones={zones.map((z) => ({
          governorate: z.governorate,
          governorateAr: z.governorateAr,
          fee: toNumber(z.fee),
          isCairo: z.isCairo,
          etaEn: z.etaEn,
          etaAr: z.etaAr,
        }))}
        codEnabled={settings.codEnabled}
        onlinePaymentEnabled={settings.onlinePaymentEnabled}
        freeShippingThreshold={settings.freeShippingThreshold ? toNumber(settings.freeShippingThreshold) : null}
      />
    </div>
  );
}
