import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { Instagram, Music2 } from "lucide-react";
import { NAV_CATEGORIES } from "@/lib/categories-nav";
import { getSiteSettings } from "@/lib/settings";
import { HeartIcon, GoldHairline } from "@/components/icons/decorative";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();
  const settings = await getSiteSettings().catch(() => null);
  const whatsappDigits = (settings?.whatsappNumber || "201000000000").replace(/\D/g, "");

  return (
    <footer className="mt-20 border-t border-mocha-700/8 bg-mocha-700 text-ivory">
      <div className="container-dodana grid grid-cols-2 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-1">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="font-heading text-2xl">DODANA</span>
            <HeartIcon className="h-3 w-3 text-blush-300" />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ivory/70">{t("about")}</p>
          <GoldHairline className="my-4" />
          <div className="flex items-center gap-3">
            <a
              href={settings?.instagramUrl || "https://instagram.com/dodana"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/20 transition hover:border-gold-400 hover:text-gold-400"
            >
              <Instagram size={16} />
            </a>
            <a
              href={settings?.tiktokUrl || "https://tiktok.com/@dodana"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/20 transition hover:border-gold-400 hover:text-gold-400"
            >
              <Music2 size={16} />
            </a>
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-ivory/20 px-3 py-2 text-xs font-medium transition hover:border-gold-400 hover:text-gold-400"
            >
              {t("whatsappOrder")}
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-heading text-sm uppercase tracking-wider text-gold-300">{t("shop")}</h3>
          <ul className="flex flex-col gap-2 text-sm text-ivory/75">
            {NAV_CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/category/${cat.slug}`} className="transition hover:text-ivory">
                  {tNav(cat.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-heading text-sm uppercase tracking-wider text-gold-300">{t("help")}</h3>
          <ul className="flex flex-col gap-2 text-sm text-ivory/75">
            <li><Link href="/faq" className="transition hover:text-ivory">{t("faq")}</Link></li>
            <li><Link href="/policies/shipping" className="transition hover:text-ivory">{t("shippingInfo")}</Link></li>
            <li><Link href="/policies/returns" className="transition hover:text-ivory">{t("returns")}</Link></li>
            <li><Link href="/track-order" className="transition hover:text-ivory">{tNav("trackOrder")}</Link></li>
            <li><Link href="/contact" className="transition hover:text-ivory">{t("contact")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-heading text-sm uppercase tracking-wider text-gold-300">{t("company")}</h3>
          <ul className="flex flex-col gap-2 text-sm text-ivory/75">
            <li><Link href="/about" className="transition hover:text-ivory">{tNav("about")}</Link></li>
            <li><Link href="/admin/login" className="transition hover:text-ivory">Admin</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10 py-5 text-center text-xs text-ivory/50">
        <p className="mb-1 font-heading italic text-ivory/70">
          {locale === "ar" ? "لقيناها عشانك، قبل ما تدوري 💗" : "Good taste, already found."}
        </p>
        © {new Date().getFullYear()} DODANA. {t("rights")}
      </div>
    </footer>
  );
}
