import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { formatEGP } from "@/lib/utils";
import { SparkleDivider } from "@/components/icons/decorative";

export const metadata: Metadata = { title: "Shipping Information" };

export default async function ShippingInfoPage() {
  const t = await getTranslations("footer");
  const tc = await getTranslations("checkout");
  const locale = await getLocale();
  const zones = await prisma.shippingZone.findMany({ where: { isActive: true }, orderBy: { governorate: "asc" } });

  return (
    <div className="container-dodana py-12">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl text-mocha-700">{t("shippingInfo")}</h1>
        <SparkleDivider className="mt-4" />
      </div>

      <div className="mx-auto max-w-2xl">
        <p className="mb-6 text-center text-sm text-mocha-500">{tc("shippingPaidSeparately")}</p>
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mocha-700/10 bg-ivory-100 text-start text-mocha-500">
                <th className="px-4 py-3 text-start font-medium">{tc("governorate")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("shippingInfo")}</th>
                <th className="px-4 py-3 text-end font-medium">Fee</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-b border-mocha-700/5 last:border-0">
                  <td className="px-4 py-3 text-mocha-700">{locale === "ar" ? z.governorateAr : z.governorate}</td>
                  <td className="px-4 py-3 text-mocha-500">{locale === "ar" ? z.etaAr : z.etaEn}</td>
                  <td className="px-4 py-3 text-end font-medium text-mocha-700">{formatEGP(toNumber(z.fee), locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
