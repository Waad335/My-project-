"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

type Promo = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderValue: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
};

type PromoForm = { code: string; type: "PERCENT" | "FIXED"; value: number; minOrderValue: string; usageLimit: string };
const emptyForm: PromoForm = { code: "", type: "PERCENT", value: 10, minOrderValue: "", usageLimit: "" };

export function PromoCodesManager({ promoCodes }: { promoCodes: Promo[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        isActive: true,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not create promo code.");
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    router.refresh();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/promo-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promo code?")) return;
    await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-mocha-700">Promo Codes</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          <Plus size={16} />
          Add Promo Code
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card-surface mb-6 grid grid-cols-1 gap-3 p-5 sm:grid-cols-5">
          <input required placeholder="CODE" className="input-field uppercase" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          <select className="input-field" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PERCENT" | "FIXED" }))}>
            <option value="PERCENT">% Percent</option>
            <option value="FIXED">EGP Fixed</option>
          </select>
          <input required type="number" placeholder="Value" className="input-field" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} />
          <input type="number" placeholder="Min order (opt.)" className="input-field" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} />
          <input type="number" placeholder="Usage limit (opt.)" className="input-field" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
          <div className="sm:col-span-5">
            {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mocha-700/10 text-start text-mocha-400">
              <th className="px-4 py-3 text-start font-medium">Code</th>
              <th className="px-4 py-3 text-start font-medium">Discount</th>
              <th className="px-4 py-3 text-start font-medium">Min Order</th>
              <th className="px-4 py-3 text-start font-medium">Usage</th>
              <th className="px-4 py-3 text-start font-medium">Active</th>
              <th className="px-4 py-3 text-end font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes.map((p) => (
              <tr key={p.id} className="border-b border-mocha-700/5 last:border-0">
                <td className="px-4 py-3 font-medium text-mocha-700">{p.code}</td>
                <td className="px-4 py-3 text-mocha-600">{p.type === "PERCENT" ? `${p.value}%` : `${p.value} EGP`}</td>
                <td className="px-4 py-3 text-mocha-600">{p.minOrderValue ? `${p.minOrderValue} EGP` : "—"}</td>
                <td className="px-4 py-3 text-mocha-600">
                  {p.usedCount}
                  {p.usageLimit ? ` / ${p.usageLimit}` : ""}
                </td>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={p.isActive} onChange={(e) => toggleActive(p.id, e.target.checked)} />
                </td>
                <td className="px-4 py-3 text-end">
                  <button onClick={() => handleDelete(p.id)} className="rounded-full p-2 text-red-400 hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {promoCodes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-mocha-400">
                  No promo codes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
