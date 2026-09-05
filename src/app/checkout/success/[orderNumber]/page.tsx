import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEGP, toNumber } from "@/lib/utils";
import { HeartIcon } from "@/components/icons/decorative";

export const metadata: Metadata = { title: "Order Confirmed" };

export default async function OrderSuccessPage({ params }: { params: { orderNumber: string } }) {
  const t = await getTranslations("orderSuccess");
  const tCart = await getTranslations("cart");
  const locale = await getLocale();

  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: { items: true, customer: true },
  });
  if (!order) notFound();

  const isPaid = order.paymentStatus === "PAID";
  const isPendingOnlinePayment = order.paymentProvider === "PAYMOB" && order.paymentStatus !== "PAID";

  return (
    <div className="container-dodana flex flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blush-100 text-blush-400">
        {isPendingOnlinePayment ? <Clock size={32} /> : <CheckCircle2 size={32} />}
      </div>
      <h1 className="font-heading text-3xl text-mocha-700">
        {isPendingOnlinePayment
          ? locale === "ar"
            ? "طلبك قيد تأكيد الدفع"
            : "Your order is awaiting payment confirmation"
          : t("title")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-mocha-500">{t("subtitle")}</p>

      <div className="card-surface mt-8 w-full max-w-md p-6 text-start">
        <div className="mb-4 flex items-center justify-between border-b border-mocha-700/10 pb-4">
          <span className="text-sm text-mocha-500">{t("orderNumber")}</span>
          <span className="flex items-center gap-1.5 font-heading text-lg text-mocha-700">
            {order.orderNumber} <HeartIcon className="h-3 w-3 text-blush-400" />
          </span>
        </div>

        <ul className="mb-4 flex flex-col gap-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm text-mocha-600">
              <span>
                {locale === "ar" ? item.nameArSnapshot : item.nameEnSnapshot} × {item.quantity}
              </span>
              <span>{formatEGP(toNumber(item.lineTotal), locale)}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-1.5 border-t border-mocha-700/10 pt-4 text-sm">
          <div className="flex justify-between text-mocha-500">
            <span>{tCart("subtotal")}</span>
            <span>{formatEGP(toNumber(order.subtotal), locale)}</span>
          </div>
          {toNumber(order.discountAmount) > 0 && (
            <div className="flex justify-between text-gold-600">
              <span>{tCart("discount")}</span>
              <span>−{formatEGP(toNumber(order.discountAmount), locale)}</span>
            </div>
          )}
          <div className="flex justify-between text-mocha-500">
            <span>{tCart("shipping")}</span>
            <span>{formatEGP(toNumber(order.shippingFee), locale)}</span>
          </div>
          <div className="flex justify-between border-t border-mocha-700/10 pt-2 text-base font-semibold text-mocha-700">
            <span>{tCart("total")}</span>
            <span>{formatEGP(toNumber(order.total), locale)}</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-mocha-400">{t("trackVia")}</p>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-secondary">
          {t("backHome")}
        </Link>
        <Link href="/" className="btn-primary">
          {t("continueShopping")}
        </Link>
      </div>
    </div>
  );
}
