import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Server-only env vars — this file is only ever imported from API route
// handlers (src/app/api/admin/upload/route.ts), never from client
// components, so nothing here reaches the browser bundle. Still, none of
// these are prefixed NEXT_PUBLIC_ on purpose: that prefix is what tells
// Next.js to inline a value into client JS, and the service role key must
// never be eligible for that.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

function extensionFor(mimeType: string): string {
  const sub = mimeType.split("/")[1] ?? "jpg";
  return sub === "jpeg" ? "jpg" : sub;
}

function getSupabaseAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  // The service role key bypasses row-level security, which is exactly what
  // an admin-only upload endpoint needs — and exactly why it must only ever
  // be read here, server-side, and never sent to the browser.
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

async function persistImageBuffer(buffer: Buffer, contentType: string): Promise<string> {
  const filename = `${randomUUID()}.${extensionFor(contentType)}`;
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(filename, buffer, {
      contentType,
      upsert: false,
    });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    return supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(filename).data.publicUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Image storage is not configured for production. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
        "(see README 'Supabase Storage' section) — or paste an image URL instead of uploading a file."
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

/**
 * File storage abstraction — every image upload in the app (admin product
 * images) goes through this one function, so this is the only place that
 * needs to know where files actually live.
 *
 * Uses Supabase Storage when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
 * set (create a *public* bucket — default name "product-images", or set
 * SUPABASE_STORAGE_BUCKET to match yours — see README "Supabase Storage").
 *
 * Falls back to writing into /public/uploads when they're not set, which
 * keeps local development working without any setup. That fallback is
 * refused in production (NODE_ENV=production): most production hosts
 * (Vercel included) have an ephemeral filesystem, so silently "succeeding"
 * there would mean uploaded images quietly disappear on the next deploy —
 * better to fail loudly and say why.
 */
export async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported image type. Use JPG, PNG, WEBP, or GIF.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Image is too large (max 5MB).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return persistImageBuffer(buffer, file.type);
}

/**
 * Copies a remote image (e.g. a temporary Instagram CDN URL) into our own
 * storage, returning the new persistent URL — or null if anything about the
 * fetch fails or looks wrong, so callers can fall back gracefully (e.g. keep
 * showing the original URL for now) instead of the whole sync failing.
 * Never throws.
 */
export async function saveImageFromUrl(remoteUrl: string): Promise<string | null> {
  try {
    const res = await fetch(remoteUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || "";
    if (!ALLOWED_TYPES.has(contentType)) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_SIZE_BYTES) return null;

    return await persistImageBuffer(buffer, contentType);
  } catch {
    return null;
  }
}
