import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Instagram, Music2, MessageCircle, Mail } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { SparkleDivider } from "@/components/icons/decorative";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const t = await getTranslations("footer");
  const settings = await getSiteSettings();
  const whatsappDigits = settings.whatsappNumber.replace(/\D/g, "");

  const links = [
    { icon: MessageCircle, label: t("whatsappOrder"), href: `https://wa.me/${whatsappDigits}` },
    { icon: Instagram, label: "Instagram", href: settings.instagramUrl },
    { icon: Music2, label: "TikTok", href: settings.tiktokUrl },
  ];

  return (
    <div className="container-dodana py-16">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-3xl text-mocha-700">{t("contact")}</h1>
        <SparkleDivider className="mt-4" />
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-3">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="card-surface flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-soft-lg"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blush-100 text-blush-500">
              <link.icon size={18} />
            </div>
            <span className="font-medium text-mocha-700">{link.label}</span>
          </a>
        ))}
        <div className="card-surface flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 text-gold-600">
            <Mail size={18} />
          </div>
          <span className="font-medium text-mocha-700">hello@dodana.com</span>
        </div>
      </div>
    </div>
  );
}
