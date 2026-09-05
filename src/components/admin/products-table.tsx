"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { DodanaImage } from "@/components/ui/dodana-image";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  sku: string;
  nameEn: string;
  categoryName: string;
  priceLabel: string;
  stock: number;
  availability: string;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  image: string | null;
};

export function ProductsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = rows.filter(
    (r) =>
      r.nameEn.toLowerCase().includes(search.toLowerCase()) || r.sku.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? If it has order history it will be deactivated instead.")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) router.refresh();
    else alert("Could not delete product.");
  }

  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-mocha-700/10 p-4">
        <input
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mocha-700/10 text-start text-mocha-400">
              <th className="px-4 py-3 text-start font-medium">Product</th>
              <th className="px-4 py-3 text-start font-medium">Category</th>
              <th className="px-4 py-3 text-start font-medium">Price</th>
              <th className="px-4 py-3 text-start font-medium">Stock</th>
              <th className="px-4 py-3 text-start font-medium">Flags</th>
              <th className="px-4 py-3 text-start font-medium">Status</th>
              <th className="px-4 py-3 text-end font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-mocha-700/5 last:border-0 hover:bg-ivory-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-ivory-200">
                      <DodanaImage src={row.image} alt={row.nameEn} fill sizes="40px" className="object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-mocha-700">{row.nameEn}</p>
                      <p className="text-xs text-mocha-400">{row.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-mocha-600">{row.categoryName}</td>
                <td className="px-4 py-3 text-mocha-700">{row.priceLabel}</td>
                <td className="px-4 py-3 text-mocha-600">{row.stock}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {row.isFeatured && <span className="rounded-full bg-blush-100 px-2 py-0.5 text-[10px] text-blush-600">Featured</span>}
                    {row.isBestSeller && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] text-gold-700">Best</span>}
                    {row.isNewArrival && <span className="rounded-full bg-mocha-100 px-2 py-0.5 text-[10px] text-mocha-700">New</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      !row.isActive
                        ? "bg-mocha-100 text-mocha-500"
                        : row.availability === "OUT_OF_STOCK"
                          ? "bg-red-50 text-red-500"
                          : row.availability === "LOW_STOCK"
                            ? "bg-gold-50 text-gold-600"
                            : "bg-green-50 text-green-600"
                    )}
                  >
                    {!row.isActive ? "Inactive" : row.availability.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/products/${row.id}`} className="rounded-full p-2 text-mocha-500 hover:bg-mocha-700/5" aria-label="Edit">
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => handleDelete(row.id)}
                      disabled={busyId === row.id}
                      className="rounded-full p-2 text-red-400 hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-mocha-400">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
