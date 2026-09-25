"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

// `statuses` is the list the signed-in role may pick (computed on the server
// with allowedOrderStatuses); the API enforces the same rule.
export function OrderStatusUpdater({
  orderId,
  currentStatus,
  statuses,
  internalNotes,
}: {
  orderId: string;
  currentStatus: string;
  statuses: string[];
  internalNotes: string;
}) {
  const router = useRouter();
  const id = useId();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(internalNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, internalNotes: notes }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Could not update the order.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor={`${id}-status`} className="label-field">
          Order Status
        </label>
        <select id={`${id}-status`} className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-notes`} className="label-field">
          Internal Notes
        </label>
        <textarea id={`${id}-notes`} rows={3} className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes visible to staff only" />
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary w-fit">
        {saving ? "Saving…" : "Update Order"}
      </button>
      {saved && <p className="text-xs text-green-600">Order updated.</p>}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
