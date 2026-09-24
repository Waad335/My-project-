import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { toNumber } from "@/lib/utils";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCurrentCustomer } from "@/lib/customer-auth";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");
  const [zones, settings, customer] = await Promise.all([
    prisma.shippingZone.findMany({ where: { isActive: true }, orderBy: { governorate: "asc" } }),
    getSiteSettings(),
    getCurrentCustomer(),
  ]);

  return (
    <div className="container-dodana py-10">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-heading text-3xl text-mocha-700 sm:text-4xl">{t("title")}</h1>
        {customer ? (
          <p className="text-sm text-mocha-500">{t("signedInAs", { email: customer.email })}</p>
        ) : (
          <p className="text-sm text-mocha-500">
            {t("haveAccount")}{" "}
            <Link href="/account/login?next=/checkout" className="font-semibold text-mocha-700 underline underline-offset-4">
              {t("signInFaster")}
            </Link>
          </p>
        )}
      </div>
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
        prefill={customer ? { name: customer.name, email: customer.email, phone: customer.phone } : null}
      />
    </div>
  );
}
