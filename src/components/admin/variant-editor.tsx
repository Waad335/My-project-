"use client";

import { Plus, Trash2 } from "lucide-react";

export type VariantEntry = {
  id?: string;
  sku: string;
  color?: string | null;
  colorHex?: string | null;
  size?: string | null;
  priceDelta?: number;
  stock: number;
  isDefault?: boolean;
};

export function VariantEditor({
  variants,
  onChange,
  baseSku,
}: {
  variants: VariantEntry[];
  onChange: (variants: VariantEntry[]) => void;
  baseSku: string;
}) {
  function addVariant() {
    onChange([
      ...variants,
      { sku: `${baseSku || "SKU"}-${variants.length + 1}`, color: "", size: "", priceDelta: 0, stock: 0, isDefault: variants.length === 0 },
    ]);
  }

  function updateVariant(index: number, patch: Partial<VariantEntry>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {variants.map((v, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 rounded-2xl border border-mocha-700/10 p-3 sm:grid-cols-6">
          <input
            placeholder="SKU"
            value={v.sku}
            onChange={(e) => updateVariant(i, { sku: e.target.value })}
            className="input-field col-span-2 sm:col-span-1"
          />
          <input
            placeholder="Color"
            value={v.color ?? ""}
            onChange={(e) => updateVariant(i, { color: e.target.value })}
            className="input-field"
          />
          <input
            type="color"
            value={v.colorHex || "#DB9A96"}
            onChange={(e) => updateVariant(i, { colorHex: e.target.value })}
            className="h-[42px] w-full rounded-2xl border border-mocha-700/15"
            aria-label="Color swatch"
          />
          <input
            placeholder="Size"
            value={v.size ?? ""}
            onChange={(e) => updateVariant(i, { size: e.target.value })}
            className="input-field"
          />
          <input
            type="number"
            placeholder="+ Price"
            value={v.priceDelta ?? 0}
            onChange={(e) => updateVariant(i, { priceDelta: Number(e.target.value) })}
            className="input-field"
          />
          <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
            <input
              type="number"
              placeholder="Stock"
              value={v.stock}
              onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
              className="input-field"
            />
            <button type="button" onClick={() => removeVariant(i)} className="flex-shrink-0 rounded-full p-2 text-red-400 hover:bg-red-50">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addVariant} className="btn-secondary w-fit">
        <Plus size={15} />
        Add Variant
      </button>
    </div>
  );
}
