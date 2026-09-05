import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { siteSettingsSchema } from "@/lib/validation";
import { getSiteSettings } from "@/lib/settings";

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const { response } = await requireAdminSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings data", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const settings = await prisma.siteSettings.update({
    where: { id: "settings" },
    data: {
      whatsappNumber: data.whatsappNumber,
      instagramUrl: data.instagramUrl || "",
      tiktokUrl: data.tiktokUrl || "",
      freeShippingThreshold: data.freeShippingThreshold ?? null,
      codEnabled: data.codEnabled,
      onlinePaymentEnabled: data.onlinePaymentEnabled,
      announcementEn: data.announcementEn || null,
      announcementAr: data.announcementAr || null,
      returnsPolicyEn: data.returnsPolicyEn,
      returnsPolicyAr: data.returnsPolicyAr,
    },
  });

  return NextResponse.json({ settings });
}
