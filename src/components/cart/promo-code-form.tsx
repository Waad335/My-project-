"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Tag, X } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatEGP } from "@/lib/utils";

export function PromoCodeForm() {
  const locale = useLocale();
  const t = useTranslations("cart");
  const subtotal = useCartStore((s) => s.subtotal());
  const appliedPromo = useCartStore((s) => s.appliedPromo);
  const setPromo = useCartStore((s) => s.setPromo);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function applyPromo(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromo({ code: data.code, discountAmount: data.discountAmount });
        setCode("");
      } else {
        setError(t("promoInvalid"));
      }
    } catch {
      setError(t("promoInvalid"));
    } finally {
      setLoading(false);
    }
  }

  if (appliedPromo) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-gold-200 bg-gold-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gold-700">
          <Tag size={15} />
          <span className="font-semibold">{appliedPromo.code}</span>
          <span className="text-gold-600">−{formatEGP(appliedPromo.discountAmount, locale)}</span>
        </div>
        <button
          type="button"
          onClick={() => setPromo(null)}
          className="text-gold-600 hover:text-gold-800"
          aria-label={t("removePromo")}
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={applyPromo} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("promoCode")}
          className="input-field flex-1"
        />
        <button type="submit" disabled={loading} className="btn-secondary whitespace-nowrap">
          {t("applyPromo")}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
