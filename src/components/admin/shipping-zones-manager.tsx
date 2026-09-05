"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";

type Zone = {
  id: string;
  governorate: string;
  governorateAr: string;
  fee: number;
  etaEn: string;
  etaAr: string;
  isCairo: boolean;
  isActive: boolean;
};

export function ShippingZonesManager({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(zones);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newZone, setNewZone] = useState({ governorate: "", governorateAr: "", fee: 0, etaEn: "Fast delivery across Egypt", etaAr: "توصيل سريع لكل مصر", isCairo: false });

  function updateRow(id: string, patch: Partial<Zone>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveRow(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    setSavingId(id);
    await fetch(`/api/admin/shipping-zones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fee: row.fee, etaEn: row.etaEn, etaAr: row.etaAr, isActive: row.isActive, isCairo: row.isCairo }),
    });
    setSavingId(null);
    router.refresh();
  }

  async function addZone(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/shipping-zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newZone),
    });
    if (res.ok) {
      setShowAdd(false);
      setNewZone({ governorate: "", governorateAr: "", fee: 0, etaEn: "Fast delivery across Egypt", etaAr: "توصيل سريع لكل مصر", isCairo: false });
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-mocha-700">Shipping Zones</h1>
        <button onClick={() => setShowAdd((s) => !s)} className="btn-secondary">
          <Plus size={15} />
          Add Zone
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addZone} className="card-surface mb-6 grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
          <input required placeholder="Governorate (EN)" className="input-field" value={newZone.governorate} onChange={(e) => setNewZone((z) => ({ ...z, governorate: e.target.value }))} />
          <input required placeholder="Governorate (AR)" dir="rtl" className="input-field" value={newZone.governorateAr} onChange={(e) => setNewZone((z) => ({ ...z, governorateAr: e.target.value }))} />
          <input required type="number" placeholder="Fee (EGP)" className="input-field" value={newZone.fee} onChange={(e) => setNewZone((z) => ({ ...z, fee: Number(e.target.value) }))} />
          <div className="sm:col-span-3">
            <button type="submit" className="btn-primary">
              Save Zone
            </button>
          </div>
        </form>
      )}

      <p className="mb-4 text-sm text-mocha-500">
        Fees here drive checkout pricing directly — no code changes needed to adjust delivery cost.
      </p>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mocha-700/10 text-start text-mocha-400">
              <th className="px-4 py-3 text-start font-medium">Governorate</th>
              <th className="px-4 py-3 text-start font-medium">Fee (EGP)</th>
              <th className="px-4 py-3 text-start font-medium">Message (EN)</th>
              <th className="px-4 py-3 text-start font-medium">Active</th>
              <th className="px-4 py-3 text-end font-medium">Save</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-mocha-700/5 last:border-0">
                <td className="px-4 py-2 font-medium text-mocha-700">
                  {row.governorate}
                  {row.isCairo && <span className="ms-1.5 rounded-full bg-blush-100 px-1.5 py-0.5 text-[10px] text-blush-600">Cairo</span>}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    className="input-field w-24 py-1.5"
                    value={row.fee}
                    onChange={(e) => updateRow(row.id, { fee: Number(e.target.value) })}
                  />
                </td>
                <td className="px-4 py-2">
                  <input className="input-field w-56 py-1.5" value={row.etaEn} onChange={(e) => updateRow(row.id, { etaEn: e.target.value })} />
                </td>
                <td className="px-4 py-2">
                  <input type="checkbox" checked={row.isActive} onChange={(e) => updateRow(row.id, { isActive: e.target.checked })} />
                </td>
                <td className="px-4 py-2 text-end">
                  <button onClick={() => saveRow(row.id)} disabled={savingId === row.id} className="rounded-full p-2 text-mocha-500 hover:bg-mocha-700/5" aria-label="Save">
                    <Save size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
