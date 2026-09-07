import { getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { HeartIcon } from "@/components/icons/decorative";

const WHATSAPP_GROUP_FALLBACK = "https://chat.whatsapp.com/C1S3FiRHR655kXmq3gvjwn";

export async function WhatsAppCta() {
  const t = await getTranslations("whatsappCta");
  const settings = await getSiteSettings().catch(() => null);
  const whatsappGroupUrl = settings?.whatsappGroupUrl || WHATSAPP_GROUP_FALLBACK;

  return (
    <section className="py-16 lg:py-24">
      <div className="container-dodana">
        <div className="rounded-card bg-blush-50 px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="flex flex-col items-center gap-3">
            <HeartIcon className="h-5 w-5 text-blush-400" />
            <h2 className="font-heading text-2xl text-mocha-700 sm:text-3xl">{t("title")}</h2>
            <p className="font-heading text-lg italic text-mocha-600">{t("subtitle")}</p>
            <a
              href={whatsappGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-3 px-7 py-3.5 text-sm"
            >
              <MessageCircle size={18} />
              {t("button")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
