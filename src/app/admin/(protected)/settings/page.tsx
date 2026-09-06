import Link from "next/link";
import { Instagram, ArrowUpRight } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, connection] = await Promise.all([
    getSiteSettings(),
    prisma.instagramConnection.findUnique({ where: { id: "instagram" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-mocha-700">Settings</h1>

      <section className="card-surface mb-6 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-lg text-mocha-700">
          <Instagram size={18} />
          Instagram Integration
        </h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <span className="block text-mocha-400">Connection status</span>
            <span className="font-medium text-mocha-700">{connection?.isConnected ? "Connected" : "Not connected"}</span>
          </div>
          <div>
            <span className="block text-mocha-400">Username</span>
            <span className="font-medium text-mocha-700">{connection?.username ? `@${connection.username}` : "—"}</span>
          </div>
          <div>
            <span className="block text-mocha-400">Last sync</span>
            <span className="font-medium text-mocha-700">{connection?.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString() : "Never"}</span>
          </div>
        </div>
        <Link href="/admin/instagram" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blush-500 hover:underline">
          Manage connection &amp; imports <ArrowUpRight size={14} />
        </Link>
      </section>

      <SettingsForm
        initial={{
          whatsappNumber: settings.whatsappNumber,
          whatsappGroupUrl: settings.whatsappGroupUrl || "",
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
