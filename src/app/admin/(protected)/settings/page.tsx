import { getSiteSettings } from "@/lib/settings";
import { toNumber } from "@/lib/utils";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-mocha-700">Settings</h1>
      <SettingsForm
        initial={{
          whatsappNumber: settings.whatsappNumber,
          instagramUrl: settings.instagramUrl,
          tiktokUrl: settings.tiktokUrl,
          freeShippingThreshold: settings.freeShippingThreshold ? toNumber(settings.freeShippingThreshold) : null,
          codEnabled: settings.codEnabled,
          onlinePaymentEnabled: settings.onlinePaymentEnabled,
          announcementEn: settings.announcementEn || "",
          announcementAr: settings.announcementAr || "",
          returnsPolicyEn: settings.returnsPolicyEn,
          returnsPolicyAr: settings.returnsPolicyAr,
        }}
      />
    </div>
  );
}
