import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-guard";
import { saveUploadedImage, saveUploadedModel } from "@/lib/storage";

export async function POST(request: Request) {
  const { response } = await requireAdminPermission("products.manage");
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    // kind=model uploads a product's .glb 3D model; anything else is an image.
    const url = formData.get("kind") === "model" ? await saveUploadedModel(file) : await saveUploadedImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
