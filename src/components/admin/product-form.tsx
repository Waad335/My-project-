"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { ImageUploader, type ImageEntry } from "@/components/admin/image-uploader";
import { VariantEditor, type VariantEntry } from "@/components/admin/variant-editor";

type Category = { id: string; nameEn: string; subcategories: { id: string; nameEn: string }[] };

export type ProductFormValues = {
  id?: string;
  sku: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  ingredientsEn: string;
  ingredientsAr: string;
  warningsEn: string;
  warningsAr: string;
  categoryId: string;
  subcategoryId: string;
  price: number;
  oldPrice: number | "";
  salePrice: number | "";
  stock: number;
  availability: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "DISCONTINUED";
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  images: ImageEntry[];
  variants: VariantEntry[];
};

export function ProductForm({ categories, initial }: { categories: Category[]; initial: ProductFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial.id);

  const selectedCategory = categories.find((c) => c.id === values.categoryId);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      sku: values.sku,
      slug: values.slug,
      nameEn: values.nameEn,
      nameAr: values.nameAr,
      descriptionEn: values.descriptionEn,
      descriptionAr: values.descriptionAr,
      ingredientsEn: values.ingredientsEn || null,
      ingredientsAr: values.ingredientsAr || null,
      warningsEn: values.warningsEn || null,
      warningsAr: values.warningsAr || null,
      categoryId: values.categoryId,
      subcategoryId: values.subcategoryId || null,
      price: Number(values.price),
      oldPrice: values.oldPrice === "" ? null : Number(values.oldPrice),
      salePrice: values.salePrice === "" ? null : Number(values.salePrice),
      stock: Number(values.stock),
      availability: values.availability,
      isFeatured: values.isFeatured,
      isBestSeller: values.isBestSeller,
      isNewArrival: values.isNewArrival,
      isActive: values.isActive,
      images: values.images,
      variants: values.variants.map((v) => ({ ...v, stock: Number(v.stock), priceDelta: Number(v.priceDelta ?? 0) })),
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/products/${values.id}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save product.");
        setSaving(false);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Could not save product.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="card-surface p-5">
        <h2 className="mb-4 font-heading text-lg text-mocha-700">Basics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Name (English)</label>
            <input
              required
              className="input-field"
              value={values.nameEn}
              onChange={(e) => {
                update("nameEn", e.target.value);
                if (!isEdit) update("slug", slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <label className="label-field">Name (Arabic)</label>
            <input required className="input-field" dir="rtl" value={values.nameAr} onChange={(e) => update("nameAr", e.target.value)} />
          </div>
          <div>
            <label className="label-field">SKU</label>
            <input required className="input-field" value={values.sku} onChange={(e) => update("sku", e.target.value)} />
          </div>
          <div>
            <label className="label-field">Slug (URL)</label>
            <input required className="input-field" value={values.slug} onChange={(e) => update("slug", e.target.value)} />
          </div>
          <div>
            <label className="label-field">Category</label>
            <select
              required
              className="input-field"
              value={values.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Subcategory</label>
            <select
              className="input-field"
              value={values.subcategoryId}
              onChange={(e) => update("subcategoryId", e.target.value)}
              disabled={!selectedCategory}
            >
              <option value="">None</option>
              {selectedCategory?.subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="mb-4 font-heading text-lg text-mocha-700">Descriptions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Description (English)</label>
            <textarea required rows={4} className="input-field" value={values.descriptionEn} onChange={(e) => update("descriptionEn", e.target.value)} />
          </div>
          <div>
            <label className="label-field">Description (Arabic)</label>
            <textarea required rows={4} dir="rtl" className="input-field" value={values.descriptionAr} onChange={(e) => update("descriptionAr", e.target.value)} />
          </div>
          <div>
            <label className="label-field">Ingredients (English) — optional</label>
            <textarea rows={3} className="input-field" value={values.ingredientsEn} onChange={(e) => update("ingredientsEn", e.target.value)} />
          </div>
          <div>
            <label className="label-field">Ingredients (Arabic) — optional</label>
            <textarea rows={3} dir="rtl" className="input-field" value={values.ingredientsAr} onChange={(e) => update("ingredientsAr", e.target.value)} />
          </div>
          <div>
            <label className="label-field">Warnings / How to use (English) — optional</label>
            <textarea rows={3} className="input-field" value={values.warningsEn} onChange={(e) => update("warningsEn", e.target.value)} />
          </div>
          <div>
            <label className="label-field">Warnings / How to use (Arabic) — optional</label>
            <textarea rows={3} dir="rtl" className="input-field" value={values.warningsAr} onChange={(e) => update("warningsAr", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="mb-4 font-heading text-lg text-mocha-700">Pricing &amp; Stock</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="label-field">Price (EGP)</label>
            <input required type="number" step="0.01" min="0" className="input-field" value={values.price} onChange={(e) => update("price", Number(e.target.value))} />
          </div>
          <div>
            <label className="label-field">Old Price</label>
            <input type="number" step="0.01" min="0" className="input-field" value={values.oldPrice} onChange={(e) => update("oldPrice", e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div>
            <label className="label-field">Sale Price</label>
            <input type="number" step="0.01" min="0" className="input-field" value={values.salePrice} onChange={(e) => update("salePrice", e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div>
            <label className="label-field">Stock Qty</label>
            <input required type="number" min="0" className="input-field" value={values.stock} onChange={(e) => update("stock", Number(e.target.value))} />
          </div>
          <div className="col-span-2 sm:col-span-4">
            <label className="label-field">Availability</label>
            <select className="input-field max-w-xs" value={values.availability} onChange={(e) => update("availability", e.target.value as ProductFormValues["availability"])}>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          {([
            ["isFeatured", "Featured"],
            ["isBestSeller", "Best Seller"],
            ["isNewArrival", "New Arrival"],
            ["isActive", "Active (visible on storefront)"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-mocha-600">
              <input type="checkbox" className="h-4 w-4 rounded border-mocha-700/30" checked={values[key]} onChange={(e) => update(key, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="card-surface p-5">
        <h2 className="mb-4 font-heading text-lg text-mocha-700">Images</h2>
        <ImageUploader images={values.images} onChange={(images) => update("images", images)} />
      </section>

      <section className="card-surface p-5">
        <h2 className="mb-1 font-heading text-lg text-mocha-700">Variants</h2>
        <p className="mb-4 text-xs text-mocha-400">Optional. Leave empty for a simple product with no color/size options.</p>
        <VariantEditor variants={values.variants} onChange={(variants) => update("variants", variants)} baseSku={values.sku} />
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
