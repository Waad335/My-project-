import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { saveUploadedImage } from "@/lib/storage";

export async function POST(request: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const url = await saveUploadedImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
