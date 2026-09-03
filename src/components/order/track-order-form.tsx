"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatEGP } from "@/lib/utils";

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  PENDING: { en: "Pending", ar: "قيد الانتظار" },
  PAYMENT_PENDING: { en: "Payment Pending", ar: "بانتظار الدفع" },
  PAID: { en: "Paid", ar: "تم الدفع" },
  PREPARING: { en: "Preparing", ar: "قيد التجهيز" },
  SHIPPED: { en: "Shipped", ar: "تم الشحن" },
  OUT_FOR_DELIVERY: { en: "Out for Delivery", ar: "خارج للتوصيل" },
  DELIVERED: { en: "Delivered", ar: "تم التوصيل" },
  CANCELLED: { en: "Cancelled", ar: "ملغي" },
  RETURNED_REFUNDED: { en: "Returned / Refunded", ar: "مرتجع / مسترد" },
};

type OrderResult = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  shippingMethodLabel: string;
  items: { nameEn: string; nameAr: string; quantity: number; lineTotal: number }[];
};

export function TrackOrderForm() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<OrderResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setResult(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = await res.json();
      if (data.found) setResult(data.order);
      else setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="card-surface flex flex-col gap-4 p-6">
        <div>
          <label className="label-field">{locale === "ar" ? "رقم الطلب" : "Order Number"}</label>
          <input
            className="input-field"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="DOD-2609-1234"
            required
          />
        </div>
        <div>
          <label className="label-field">{locale === "ar" ? "رقم الهاتف" : "Phone Number"}</label>
          <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {t("trackOrder")}
        </button>
      </form>

      {notFound && (
        <p className="mt-4 text-center text-sm text-red-500">
          {locale === "ar" ? "لم يتم العثور على الطلب. تأكدي من البيانات." : "Order not found. Please check your details."}
        </p>
      )}

      {result && (
        <div className="card-surface mt-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-heading text-lg text-mocha-700">{result.orderNumber}</span>
            <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700">
              {locale === "ar" ? STATUS_LABELS[result.status]?.ar : STATUS_LABELS[result.status]?.en}
            </span>
          </div>
          <ul className="mb-4 flex flex-col gap-1.5 text-sm text-mocha-600">
            {result.items.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {locale === "ar" ? item.nameAr : item.nameEn} × {item.quantity}
                </span>
                <span>{formatEGP(item.lineTotal, locale)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-mocha-700/10 pt-3 text-sm font-semibold text-mocha-700">
            <span>{locale === "ar" ? "الإجمالي" : "Total"}</span>
            <span>{formatEGP(result.total, locale)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
