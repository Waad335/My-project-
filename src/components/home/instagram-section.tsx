import { getTranslations } from "next-intl/server";
import { Instagram } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { SparkleDivider } from "@/components/icons/decorative";

export async function InstagramSection() {
  const t = await getTranslations("sections");
  const settings = await getSiteSettings().catch(() => null);
  const tiles = Array.from({ length: 6 });

  return (
    <section className="py-16">
      <div className="container-dodana text-center">
        <h2 className="font-heading text-3xl text-mocha-700">{t("instagram")}</h2>
        <a
          href={settings?.instagramUrl || "https://instagram.com/dodana"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-gold-500 hover:text-gold-600"
        >
          <Instagram size={15} />
          {t("instagramSubtitle")}
        </a>
        <SparkleDivider className="mt-4" />

        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
          {tiles.map((_, i) => (
            <a
              key={i}
              href={settings?.instagramUrl || "https://instagram.com/dodana"}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-blush-100 via-ivory-200 to-gold-100"
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-mocha-900/30">
                <Instagram size={20} className="text-white" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
