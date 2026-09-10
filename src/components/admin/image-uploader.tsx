"use client";

import { useRef, useState } from "react";
import { Upload, X, Link2 } from "lucide-react";
import { DodanaImage } from "@/components/ui/dodana-image";

export type ImageEntry = { url: string; altEn?: string | null; altAr?: string | null };

export function ImageUploader({ images, onChange }: { images: ImageEntry[]; onChange: (images: ImageEntry[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: ImageEntry[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        uploaded.push({ url: data.url });
      }
      onChange([...images, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addUrl() {
    if (!urlInput.trim()) return;
    onChange([...images, { url: urlInput.trim() }]);
    setUrlInput("");
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div key={img.url + i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-mocha-700/10">
            <DodanaImage src={img.url} alt="" fill sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-mocha-900/70 text-white"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-mocha-700/20 text-mocha-400 hover:border-blush-400 hover:text-blush-400"
        >
          <Upload size={16} />
          <span className="text-[10px]">{uploading ? "Uploading…" : "Upload"}</span>
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-mocha-400" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Or paste an image URL"
            className="input-field ps-9"
          />
        </div>
        <button type="button" onClick={addUrl} className="btn-secondary whitespace-nowrap">
          Add URL
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <p className="mt-1.5 text-xs text-mocha-400">
        Uploaded files are stored locally under /public/uploads — fine for development, but swap for S3 / Supabase
        Storage before deploying to serverless hosting (see README).
      </p>
    </div>
  );
}
