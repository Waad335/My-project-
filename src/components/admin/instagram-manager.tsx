"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2, Pencil, Check, ExternalLink, Instagram } from "lucide-react";
import { DodanaImage } from "@/components/ui/dodana-image";

type Connection = {
  isConnected: boolean;
  username: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
} | null;

type ImportRow = {
  id: string;
  mediaId: string;
  mediaType: string;
  permalink: string;
  caption: string | null;
  mediaTimestamp: string | null;
  imageUrl: string | null;
  detectedNameEn: string | null;
  detectedPriceEGP: number | null;
  priceNeedsReview: boolean;
  detectedCategorySlug: string | null;
  categoryNeedsReview: boolean;
  status: string;
  publishedProductId: string | null;
  createdAt: string;
};

type CategoryOption = { slug: string; label: string };

const STATUS_LABEL: Record<string, string> = {
  NEEDS_REVIEW: "Needs Review",
  READY: "Ready",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};

const STATUS_CLASS: Record<string, string> = {
  NEEDS_REVIEW: "bg-amber-50 text-amber-700",
  READY: "bg-blue-50 text-blue-700",
  PUBLISHED: "bg-green-50 text-green-700",
  REJECTED: "bg-mocha-700/5 text-mocha-400",
};

export function InstagramManager({
  configured,
  connectedNotice,
  errorNotice,
  connection,
  imports,
  categoryOptions,
}: {
  configured: boolean;
  connectedNotice: boolean;
  errorNotice: string | null;
  connection: Connection;
  imports: ImportRow[];
  categoryOptions: CategoryOption[];
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    const res = await fetch("/api/admin/instagram/sync", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSyncing(false);
    if (!res.ok) {
      setSyncMessage(data.error || "Sync failed.");
    } else {
      setSyncMessage(`Synced: ${data.result.created} new, ${data.result.updated} updated, ${data.result.skipped} skipped.`);
    }
    router.refresh();
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect the Instagram account? Existing imports will be kept.")) return;
    setDisconnecting(true);
    await fetch("/api/admin/instagram/disconnect", { method: "POST" });
    setDisconnecting(false);
    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-mocha-700">Instagram Imports</h1>

      {connectedNotice && (
        <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">Instagram account connected successfully.</div>
      )}
      {errorNotice && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorNotice}</div>}

      <section className="card-surface mb-6 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-lg text-mocha-700">
          <Instagram size={18} />
          Connection
        </h2>

        {!configured && (
          <p className="text-sm text-mocha-500">
            Instagram is not configured yet. Set <code className="rounded bg-mocha-700/5 px-1">INSTAGRAM_APP_ID</code>,{" "}
            <code className="rounded bg-mocha-700/5 px-1">INSTAGRAM_APP_SECRET</code>, and{" "}
            <code className="rounded bg-mocha-700/5 px-1">INSTAGRAM_REDIRECT_URI</code> as environment variables, then redeploy.
          </p>
        )}

        {configured && !connection?.isConnected && (
          <div>
            <p className="mb-3 text-sm text-mocha-500">No Instagram account connected yet.</p>
            <a href="/api/admin/instagram/connect" className="btn-primary inline-flex">
              Connect Instagram
            </a>
          </div>
        )}

        {configured && connection?.isConnected && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <span className="block text-mocha-400">Account</span>
                <span className="font-medium text-mocha-700">@{connection.username || "unknown"}</span>
              </div>
              <div>
                <span className="block text-mocha-400">Last sync</span>
                <span className="font-medium text-mocha-700">
                  {connection.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString() : "Never"}
                </span>
              </div>
              <div>
                <span className="block text-mocha-400">Last sync result</span>
                <span className="font-medium text-mocha-700">
                  {connection.lastSyncStatus === "error" ? connection.lastSyncError || "Error" : connection.lastSyncStatus === "success" ? "Success" : "—"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSync} disabled={syncing} className="btn-primary">
                <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Syncing…" : "Sync Instagram Posts"}
              </button>
              <button onClick={handleDisconnect} disabled={disconnecting} className="rounded-full px-4 py-2 text-sm text-mocha-500 hover:bg-mocha-700/5">
                Disconnect
              </button>
              {syncMessage && <span className="text-sm text-mocha-500">{syncMessage}</span>}
            </div>
          </div>
        )}
      </section>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mocha-700/10 text-start text-mocha-400">
              <th className="px-4 py-3 text-start font-medium">Post</th>
              <th className="px-4 py-3 text-start font-medium">Product Name</th>
              <th className="px-4 py-3 text-start font-medium">Price (EGP)</th>
              <th className="px-4 py-3 text-start font-medium">Category</th>
              <th className="px-4 py-3 text-start font-medium">Stock</th>
              <th className="px-4 py-3 text-start font-medium">Status</th>
              <th className="px-4 py-3 text-end font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {imports.map((row) => (
              <ImportRowItem key={row.id} row={row} categoryOptions={categoryOptions} onChanged={() => router.refresh()} />
            ))}
            {imports.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-mocha-400">
                  No Instagram imports yet. Connect your account and sync to see posts here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImportRowItem({
  row,
  categoryOptions,
  onChanged,
}: {
  row: ImportRow;
  categoryOptions: CategoryOption[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.detectedNameEn || "");
  const [price, setPrice] = useState(row.detectedPriceEGP !== null ? String(row.detectedPriceEGP) : "");
  const [category, setCategory] = useState(row.detectedCategorySlug || "");
  const [stock, setStock] = useState("10");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPublish =
    row.status !== "PUBLISHED" &&
    !!row.detectedNameEn &&
    row.detectedPriceEGP !== null &&
    !row.priceNeedsReview &&
    !!row.detectedCategorySlug &&
    !row.categoryNeedsReview;

  async function handleSaveEdit() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/instagram/imports/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        detectedNameEn: name.trim() || undefined,
        detectedPriceEGP: price.trim() ? Number(price) : null,
        detectedCategorySlug: category.trim() ? category : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save changes.");
      return;
    }
    setEditing(false);
    onChanged();
  }

  async function handlePublish() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/instagram/imports/${row.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: Number(stock) || 0 }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not publish.");
      return;
    }
    onChanged();
  }

  async function handleDelete() {
    if (!confirm("Delete this import? This does not delete a published product.")) return;
    await fetch(`/api/admin/instagram/imports/${row.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <tr className="border-b border-mocha-700/5 align-top last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-mocha-700/5">
            <DodanaImage src={row.imageUrl} alt="" fill sizes="56px" className="object-cover" unoptimized />
          </div>
          <div className="max-w-[220px]">
            <a href={row.permalink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blush-500 hover:underline">
              View on Instagram <ExternalLink size={11} />
            </a>
            <p className="mt-1 line-clamp-2 text-xs text-mocha-400">{row.caption || "No caption"}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        ) : (
          <span className="text-mocha-700">{row.detectedNameEn || <span className="text-mocha-300">Not detected</span>}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <input type="number" className="input-field w-24" value={price} onChange={(e) => setPrice(e.target.value)} />
        ) : row.detectedPriceEGP !== null ? (
          <span className="text-mocha-700">{row.detectedPriceEGP} EGP</span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Needs Review</span>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select category…</option>
            {categoryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        ) : row.detectedCategorySlug && !row.categoryNeedsReview ? (
          <span className="text-mocha-700">{categoryOptions.find((c) => c.slug === row.detectedCategorySlug)?.label || row.detectedCategorySlug}</span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Needs Category Review</span>
        )}
      </td>
      <td className="px-4 py-3">
        <input type="number" min={0} className="input-field w-20" value={stock} onChange={(e) => setStock(e.target.value)} disabled={row.status === "PUBLISHED"} />
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status] || ""}`}>{STATUS_LABEL[row.status] || row.status}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-end gap-1.5">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center gap-1.5">
            {editing ? (
              <button onClick={handleSaveEdit} disabled={saving} className="rounded-full p-2 text-green-600 hover:bg-green-50" title="Save">
                <Check size={15} />
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="rounded-full p-2 text-mocha-500 hover:bg-mocha-700/5" title="Edit">
                <Pencil size={15} />
              </button>
            )}
            {row.status !== "PUBLISHED" && (
              <button onClick={handlePublish} disabled={!canPublish || saving} className="btn-primary !px-3 !py-1.5 text-xs disabled:opacity-40">
                Approve &amp; Publish
              </button>
            )}
            <button onClick={handleDelete} className="rounded-full p-2 text-red-400 hover:bg-red-50" title="Delete">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
