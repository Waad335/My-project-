import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatEGP, toNumber } from "@/lib/utils";
import { DodanaImage } from "@/components/ui/dodana-image";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const customer = await requireCustomer("/account/orders");
  const t = await getTranslations("account");
  const locale = await getLocale();
  const orders = await prisma.order.findMany({
    where: { userId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true },
  });

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-mocha-700/15 px-6 py-20 text-center">
        <p className="font-heading text-2xl text-mocha-700">{t("noOrdersTitle")}</p>
        <p className="max-w-sm text-sm text-mocha-500">{t("noOrdersBody")}</p>
        <Link href="/shop" className="btn-primary mt-2">
          {t("startShopping")}
        </Link>
      </div>
    );
  }

  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium" });

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => {
        const status = ORDER_STATUS_LABELS[order.status];
        const count = order.items.reduce((n, i) => n + i.quantity, 0);
        return (
          <li key={order.id}>
            <details className="group rounded-card border border-mocha-700/8 bg-white open:shadow-soft">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-2 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg text-mocha-700">
                    {t("orderNumber")} {order.orderNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-mocha-500">
                    <time dateTime={order.createdAt.toISOString()}>{dateFormat.format(order.createdAt)}</time> ·{" "}
                    {t("itemsCount", { count })}
                  </p>
                </div>
                <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-mocha-700">
                  {status ? (locale === "ar" ? status.ar : status.en) : order.status}
                </span>
                <span className="text-sm font-semibold text-mocha-700">{formatEGP(toNumber(order.total), locale)}</span>
                <ChevronDown size={18} aria-hidden="true" className="text-mocha-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-mocha-700/8 px-5 pb-5 sm:px-6 sm:pb-6">
                <ul className="divide-y divide-mocha-700/8">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 py-4">
                      <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                        <DodanaImage src={item.imageSnapshot} alt="" fill sizes="56px" className="object-cover" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-mocha-700">
                          {locale === "ar" ? item.nameArSnapshot : item.nameEnSnapshot}
                        </p>
                        <p className="text-xs text-mocha-500">
                          {item.variantLabel ? `${item.variantLabel} · ` : ""}× {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm text-mocha-700">{formatEGP(toNumber(item.lineTotal), locale)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-2 flex flex-col gap-1.5 border-t border-mocha-700/8 pt-4 text-sm">
                  <div className="flex justify-between text-mocha-500">
                    <dt>{t("subtotal")}</dt>
                    <dd>{formatEGP(toNumber(order.subtotal), locale)}</dd>
                  </div>
                  {toNumber(order.discountAmount) > 0 && (
                    <div className="flex justify-between text-mocha-500">
                      <dt>{t("discount")}</dt>
                      <dd>−{formatEGP(toNumber(order.discountAmount), locale)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-mocha-500">
                    <dt>{t("shipping")}</dt>
                    <dd>{formatEGP(toNumber(order.shippingFee), locale)}</dd>
                  </div>
                  <div className="flex justify-between font-semibold text-mocha-700">
                    <dt>{t("total")}</dt>
                    <dd>{formatEGP(toNumber(order.total), locale)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-mocha-500">
                  {order.shippingCity}, {order.shippingGovernorate}
                </p>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
