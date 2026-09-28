import { getSiteSettings } from "@/lib/settings";
import { toNumber } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";
import { apiJson, mobileRoute } from "@/lib/mobile/http";
import type { SettingsResponse } from "@/lib/mobile/types";

export const dynamic = "force-dynamic";

// Public store settings. v1 of the app supports Cash on Delivery only, so
// that's the only payment method it's ever offered (and only while enabled).
export const GET = mobileRoute(async () => {
  const s = await getSiteSettings();
  const body: SettingsResponse = {
    paymentMethods: s.codEnabled ? ["COD"] : [],
    freeShippingThreshold: s.freeShippingThreshold ? toNumber(s.freeShippingThreshold) : null,
    whatsappNumber: s.whatsappNumber,
    whatsappGroupUrl: s.whatsappGroupUrl,
    instagramUrl: s.instagramUrl,
    tiktokUrl: s.tiktokUrl,
    announcementEn: s.announcementEn,
    announcementAr: s.announcementAr,
    returnsPolicyEn: s.returnsPolicyEn,
    returnsPolicyAr: s.returnsPolicyAr,
    siteUrl: SITE_URL,
  };
  return apiJson(body, { cache: "public" });
});
