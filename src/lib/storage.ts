import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * File storage abstraction. Today this saves to the local filesystem under
 * /public/uploads, which is fine for a single-server / local deployment but
 * is NOT persistent on most serverless hosts (e.g. Vercel's filesystem is
 * ephemeral). Before going live on serverless hosting, swap the body of
 * `saveUploadedImage` for a call to S3 / Supabase Storage / Cloudinary —
 * every caller in the app goes through this one function.
 */
export async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported image type. Use JPG, PNG, WEBP, or GIF.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Image is too large (max 5MB).");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/${filename}`;
}
