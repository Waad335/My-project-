"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Truck, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatEGP } from "@/lib/utils";

type Zone = {
  governorate: string;
  governorateAr: string;
  fee: number;
  isCairo: boolean;
  etaEn: string;
  etaAr: string;
};

export function CheckoutForm({
  zones,
  codEnabled,
  onlinePaymentEnabled,
  freeShippingThreshold,
}: {
  zones: Zone[];
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  freeShippingThreshold: number | null;
}) {
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const appliedPromo = useCartStore((s) => s.appliedPromo);
  const clearCart = useCartStore((s) => s.clear);
  const discount = appliedPromo?.discountAmount ?? 0;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    whatsappSame: true,
    email: "",
    governorate: "",
    city: "",
    address: "",
    buildingInfo: "",
    notes: "",
    paymentMethod: codEnabled ? "COD" : "PAYMOB",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const selectedZone = zones.find((z) => z.governorate === form.governorate) ?? null;
  const freeShippingApplied = freeShippingThreshold !== null && subtotal >= freeShippingThreshold;
  const shippingFee = selectedZone ? (freeShippingApplied ? 0 : selectedZone.fee) : 0;
  const total = Math.max(subtotal - discount + shippingFee, 0);

  const shippingMessage = useMemo(() => {
    if (!selectedZone) return null;
    return locale === "ar" ? selectedZone.etaAr : selectedZone.etaEn;
  }, [selectedZone, locale]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = t("required");
    if (!/^01[0-25]\d{8}$/.test(form.phone.trim())) next.phone = t("required");
    if (!form.governorate) next.governorate = t("required");
    if (form.city.trim().length < 2) next.city = t("required");
    if (form.address.trim().length < 5) next.address = t("required");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (items.length === 0 || !validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          whatsapp: form.whatsappSame ? form.phone : form.whatsapp,
          email: form.email,
          governorate: form.governorate,
          city: form.city,
          address: form.address,
          buildingInfo: form.buildingInfo,
          notes: form.notes,
          paymentMethod: form.paymentMethod,
          promoCode: appliedPromo?.code || "",
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || t("required"));
        setSubmitting(false);
        return;
      }

      clearCart();
      if (data.paymentMode === "redirect" && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        router.push(`/checkout/success/${data.orderNumber}`);
      }
    } catch {
      setServerError(t("required"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <section className="card-surface p-5">
          <h2 className="mb-4 font-heading text-lg text-mocha-700">{t("customerInfo")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("name")} error={errors.name}>
              <input className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </Field>
            <Field label={t("phone")} error={errors.phone}>
              <input
                className="input-field"
                placeholder="01xxxxxxxxx"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-2 text-sm text-mocha-600">
                <input
                  type="checkbox"
                  checked={form.whatsappSame}
                  onChange={(e) => update("whatsappSame", e.target.checked)}
                  className="h-4 w-4 rounded border-mocha-700/30"
                />
                {t("whatsappSame")}
              </label>
              {!form.whatsappSame && (
                <Field label={t("whatsapp")}>
                  <input className="input-field" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
                </Field>
              )}
            </div>
            <Field label={t("email")} className="sm:col-span-2">
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="card-surface p-5">
          <h2 className="mb-4 font-heading text-lg text-mocha-700">{t("shippingMethod")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("governorate")} error={errors.governorate}>
              <select
                className="input-field"
                value={form.governorate}
                onChange={(e) => update("governorate", e.target.value)}
              >
                <option value="">{t("selectGovernorate")}</option>
                {zones.map((z) => (
                  <option key={z.governorate} value={z.governorate}>
                    {locale === "ar" ? z.governorateAr : z.governorate}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("city")} error={errors.city}>
              <input className="input-field" value={form.city} onChange={(e) => update("city", e.target.value)} />
            </Field>
            <Field label={t("address")} className="sm:col-span-2" error={errors.address}>
              <input className="input-field" value={form.address} onChange={(e) => update("address", e.target.value)} />
            </Field>
            <Field label={t("buildingInfo")} className="sm:col-span-2">
              <input
                className="input-field"
                value={form.buildingInfo}
                onChange={(e) => update("buildingInfo", e.target.value)}
              />
            </Field>
            <Field label={t("notes")} className="sm:col-span-2">
              <textarea
                className="input-field"
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </Field>
          </div>

          {shippingMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-blush-50 px-4 py-3 text-sm text-mocha-600">
              <Truck size={16} className="text-blush-400" />
              {shippingMessage}
            </div>
          )}
          <p className="mt-3 text-xs text-mocha-400">{t("shippingPaidSeparately")}</p>
        </section>

        <section className="card-surface p-5">
          <h2 className="mb-4 font-heading text-lg text-mocha-700">{t("paymentMethod")}</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            {codEnabled && (
              <label
                className={`flex flex-1 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                  form.paymentMethod === "COD" ? "border-mocha-700 bg-mocha-700/5" : "border-mocha-700/15"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={form.paymentMethod === "COD"}
                  onChange={() => update("paymentMethod", "COD")}
                />
                {t("cod")}
              </label>
            )}
            {onlinePaymentEnabled && (
              <label
                className={`flex flex-1 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                  form.paymentMethod === "PAYMOB" ? "border-mocha-700 bg-mocha-700/5" : "border-mocha-700/15"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={form.paymentMethod === "PAYMOB"}
                  onChange={() => update("paymentMethod", "PAYMOB")}
                />
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-gold-500" />
                  {t("payOnline")}
                </span>
              </label>
            )}
          </div>
        </section>
      </div>

      <div className="card-surface flex h-fit flex-col gap-4 p-5">
        <h2 className="font-heading text-lg text-mocha-700">{t("orderSummary")}</h2>
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const key = `${item.productId}-${item.variantId ?? "base"}`;
            const name = locale === "ar" ? item.nameAr : item.nameEn;
            return (
              <li key={key} className="flex items-center gap-3">
                <div className="relative h-14 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-ivory-200">
                  {item.image && <Image src={item.image} alt={name} fill sizes="48px" className="object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="line-clamp-1 text-sm text-mocha-700">{name}</p>
                  <p className="text-xs text-mocha-400">
                    {item.quantity} × {formatEGP(item.unitPrice, locale)}
                  </p>
                </div>
                <span className="text-sm font-medium text-mocha-700">
                  {formatEGP(item.unitPrice * item.quantity, locale)}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-2 border-t border-mocha-700/10 pt-4 text-sm">
          <div className="flex justify-between text-mocha-500">
            <span>{tCart("subtotal")}</span>
            <span className="font-medium text-mocha-700">{formatEGP(subtotal, locale)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-gold-600">
              <span>{tCart("discount")}</span>
              <span>−{formatEGP(discount, locale)}</span>
            </div>
          )}
          <div className="flex justify-between text-mocha-500">
            <span>{tCart("shipping")}</span>
            <span className="font-medium text-mocha-700">
              {selectedZone ? formatEGP(shippingFee, locale) : tCart("shippingCalculated")}
            </span>
          </div>
          <div className="flex justify-between border-t border-mocha-700/10 pt-2 text-base font-semibold text-mocha-700">
            <span>{tCart("total")}</span>
            <span>{formatEGP(total, locale)}</span>
          </div>
        </div>

        {serverError && <p className="text-sm text-red-500">{serverError}</p>}

        <button type="submit" disabled={submitting || items.length === 0} className="btn-primary w-full">
          {submitting ? t("processing") : t("placeOrder")}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label-field">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
