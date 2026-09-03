"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { slugify } from "@/lib/utils";

type Subcategory = { id?: string; slug: string; nameEn: string; nameAr: string };
type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  emoji: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  sortOrder: number;
  isActive: boolean;
  subcategories: Subcategory[];
  productCount: number;
};

const emptyForm = {
  id: undefined as string | undefined,
  slug: "",
  nameEn: "",
  nameAr: "",
  emoji: "",
  descriptionEn: "",
  descriptionAr: "",
  sortOrder: 0,
  isActive: true,
  subcategories: [] as Subcategory[],
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startCreate() {
    setForm(emptyForm);
    setFormOpen(true);
  }

  function startEdit(cat: Category) {
    setForm({
      id: cat.id,
      slug: cat.slug,
      nameEn: cat.nameEn,
      nameAr: cat.nameAr,
      emoji: cat.emoji ?? "",
      descriptionEn: cat.descriptionEn ?? "",
      descriptionAr: cat.descriptionAr ?? "",
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      subcategories: cat.subcategories,
    });
    setFormOpen(true);
  }

  function addSub() {
    setForm((f) => ({ ...f, subcategories: [...f.subcategories, { slug: "", nameEn: "", nameAr: "" }] }));
  }
  function updateSub(i: number, patch: Partial<Subcategory>) {
    setForm((f) => ({ ...f, subcategories: f.subcategories.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  }
  function removeSub(i: number) {
    setForm((f) => ({ ...f, subcategories: f.subcategories.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(form.id ? `/api/admin/categories/${form.id}` : "/api/admin/categories", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save category.");
      return;
    }
    setFormOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error || "Could not delete category.");
    else router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-mocha-700">Categories</h1>
        <button onClick={startCreate} className="btn-primary">
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="card-surface mb-6 flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg text-mocha-700">{form.id ? "Edit Category" : "New Category"}</h2>
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-full p-1.5 hover:bg-mocha-700/5">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Name (English)</label>
              <input
                required
                className="input-field"
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value, slug: f.id ? f.slug : slugify(e.target.value) }))}
              />
            </div>
            <div>
              <label className="label-field">Name (Arabic)</label>
              <input required dir="rtl" className="input-field" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">Slug</label>
              <input required className="input-field" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">Emoji</label>
              <input className="input-field" value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="🧴" />
            </div>
            <div>
              <label className="label-field">Description (English)</label>
              <textarea rows={2} className="input-field" value={form.descriptionEn} onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">Description (Arabic)</label>
              <textarea rows={2} dir="rtl" className="input-field" value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} />
            </div>
          </div>

          <label className="flex w-fit items-center gap-2 text-sm text-mocha-600">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            Active
          </label>

          <div>
            <p className="label-field">Subcategories</p>
            <div className="flex flex-col gap-2">
              {form.subcategories.map((sub, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input placeholder="Name (EN)" className="input-field" value={sub.nameEn} onChange={(e) => updateSub(i, { nameEn: e.target.value, slug: sub.slug || slugify(e.target.value) })} />
                  <input placeholder="Name (AR)" dir="rtl" className="input-field" value={sub.nameAr} onChange={(e) => updateSub(i, { nameAr: e.target.value })} />
                  <div className="flex gap-2">
                    <input placeholder="slug" className="input-field" value={sub.slug} onChange={(e) => updateSub(i, { slug: e.target.value })} />
                    <button type="button" onClick={() => removeSub(i)} className="rounded-full p-2 text-red-400 hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addSub} className="btn-secondary mt-2">
              <Plus size={14} />
              Add Subcategory
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mocha-700/10 text-start text-mocha-400">
              <th className="px-4 py-3 text-start font-medium">Category</th>
              <th className="px-4 py-3 text-start font-medium">Subcategories</th>
              <th className="px-4 py-3 text-start font-medium">Products</th>
              <th className="px-4 py-3 text-start font-medium">Status</th>
              <th className="px-4 py-3 text-end font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-mocha-700/5 last:border-0 hover:bg-ivory-100">
                <td className="px-4 py-3">
                  <span className="me-1.5">{cat.emoji}</span>
                  <span className="font-medium text-mocha-700">{cat.nameEn}</span>
                </td>
                <td className="px-4 py-3 text-mocha-500">{cat.subcategories.map((s) => s.nameEn).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-mocha-600">{cat.productCount}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.isActive ? "bg-green-50 text-green-600" : "bg-mocha-100 text-mocha-500"}`}>
                    {cat.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => startEdit(cat)} className="rounded-full p-2 text-mocha-500 hover:bg-mocha-700/5">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="rounded-full p-2 text-red-400 hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
