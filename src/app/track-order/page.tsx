import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TrackOrderForm } from "@/components/order/track-order-form";

export const metadata: Metadata = { title: "Track Your Order" };

export default async function TrackOrderPage() {
  const t = await getTranslations("nav");
  return (
    <div className="container-dodana py-12">
      <h1 className="mb-8 text-center font-heading text-3xl text-mocha-700">{t("trackOrder")}</h1>
      <TrackOrderForm />
    </div>
  );
}
