"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  whatsappNumber: string;
  instagramUrl: string;
  tiktokUrl: string;
  freeShippingThreshold: number | null;
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  announcementEn: string;
  announcementAr: string;
  returnsPolicyEn: string;
  returnsPolicyAr: string;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save settings.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="card-surface p-5">
        <h2 className="mb-4 font-heading text-lg text-mocha-700">Contact &amp; Social</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">WhatsApp Number (with country code, no +)</label>
            <input className="input-field" placeholder="201234567890" value={values.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value)} />
          </div>
          <div>
            <label className="label-field">Instagram URL</label>
            <input className="input-field" value={values.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} />
          </div>
          <div>
            <label className="label-field">TikTok URL</label>
            <input className="input-field" value={values.tiktokUrl} onChange={(e) => update("tiktokUrl", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="mb-4 font-heading text-lg text-mocha-700">Payments &amp; Shipping</h2>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm text-mocha-600">
            <input type="checkbox" checked={values.codEnabled} onChange={(e) => update("codEnabled", e.target.checked)} />
            Cash on Delivery enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-mocha-600">
            <input type="checkbox" checked={values.onlinePaymentEnabled} onChange={(e) => update("onlinePaymentEnabled", e.target.checked)} />
            Online payment (Paymob) enabled — only turn on once PAYMOB_* env vars are configured
          </label>
          <div className="max-w-xs">
            <label className="label-field">Free shipping threshold (EGP) — leave empty to disable</label>
            <input
              type="number"
              className="input-field"
              value={values.freeShippingThreshold ?? ""}
              onChange={(e) => update("freeShippingThreshold", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="mb-4 font-heading text-lg text-mocha-700">Announcement Bar</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">English (leave empty to hide)</label>
            <input className="input-field" value={values.announcementEn} onChange={(e) => update("announcementEn", e.target.value)} />
          </div>
          <div>
            <label className="label-field">Arabic</label>
            <input dir="rtl" className="input-field" value={values.announcementAr} onChange={(e) => update("announcementAr", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="mb-4 font-heading text-lg text-mocha-700">Returns &amp; Exchanges Policy</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">English</label>
            <textarea rows={8} className="input-field" value={values.returnsPolicyEn} onChange={(e) => update("returnsPolicyEn", e.target.value)} />
          </div>
          <div>
            <label className="label-field">Arabic</label>
            <textarea rows={8} dir="rtl" className="input-field" value={values.returnsPolicyAr} onChange={(e) => update("returnsPolicyAr", e.target.value)} />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved.</span>}
      </div>
    </form>
  );
}
