"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  "PENDING",
  "PAYMENT_PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED_REFUNDED",
];

export function OrderStatusUpdater({ orderId, currentStatus, internalNotes }: { orderId: string; currentStatus: string; internalNotes: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(internalNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, internalNotes: notes }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="label-field">Order Status</label>
        <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-field">Internal Notes</label>
        <textarea rows={3} className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes visible to staff only" />
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary w-fit">
        {saving ? "Saving…" : "Update Order"}
      </button>
      {saved && <p className="text-xs text-green-600">Order updated.</p>}
    </div>
  );
}
