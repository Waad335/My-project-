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
    <section className="py-16">
      <div className="container-dodana">
        <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-blush-200 via-blush-100 to-gold-100 px-6 py-12 text-center sm:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute -top-8 start-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-white/30 blur-3xl" />
          <div className="relative flex flex-col items-center gap-3">
            <HeartIcon className="h-5 w-5 text-blush-500" />
            <h2 className="font-heading text-2xl text-mocha-700 sm:text-3xl">{t("title")}</h2>
            <p className="font-heading text-lg italic text-mocha-600">{t("subtitle")}</p>
            <a
              href={whatsappGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-mocha-700 px-7 py-3.5 text-sm font-semibold text-ivory shadow-soft-lg transition-all duration-200 hover:bg-mocha-800 active:scale-[0.98]"
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
