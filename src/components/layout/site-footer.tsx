import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { Instagram, Music2, MessageCircle } from "lucide-react";
import { NAV_CATEGORIES } from "@/lib/categories-nav";
import { getSiteSettings } from "@/lib/settings";
import { HeartIcon, GoldHairline } from "@/components/icons/decorative";

const INSTAGRAM_FALLBACK = "https://www.instagram.com/dodana.girls/";
const TIKTOK_FALLBACK = "https://www.tiktok.com/@dodana352";
const WHATSAPP_GROUP_FALLBACK = "https://chat.whatsapp.com/C1S3FiRHR655kXmq3gvjwn";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();
  const settings = await getSiteSettings().catch(() => null);

  const followLinks = [
    { icon: Instagram, label: "Instagram", href: settings?.instagramUrl || INSTAGRAM_FALLBACK },
    { icon: Music2, label: "TikTok", href: settings?.tiktokUrl || TIKTOK_FALLBACK },
    { icon: MessageCircle, label: t("whatsappGroup"), href: settings?.whatsappGroupUrl || WHATSAPP_GROUP_FALLBACK },
  ];

  return (
    <footer className="mt-20 border-t border-mocha-700/8 bg-mocha-700 text-ivory">
      <div className="container-dodana grid grid-cols-2 gap-x-8 gap-y-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-1">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="font-heading text-2xl">DODANA</span>
            <HeartIcon className="h-3 w-3 text-blush-300" />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ivory/70">{t("about")}</p>
          <GoldHairline className="my-4" />
          <p className="font-heading italic text-blush-300">
            {locale === "ar" ? "لقيناها عشانك، قبل ما تدوري 💗" : "Good taste, already found."}
          </p>
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
            <li><Link href="/contact" className="transition hover:text-ivory">{t("contact")}</Link></li>
            <li><Link href="/policies/shipping" className="transition hover:text-ivory">{t("shippingInfo")}</Link></li>
            <li><Link href="/policies/returns" className="transition hover:text-ivory">{t("returns")}</Link></li>
            <li><Link href="/faq" className="transition hover:text-ivory">{t("faq")}</Link></li>
            <li><Link href="/track-order" className="transition hover:text-ivory">{tNav("trackOrder")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-heading text-sm uppercase tracking-wider text-gold-300">{t("followUs")}</h3>
          <ul className="flex flex-col gap-2 text-sm text-ivory/75">
            {followLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-ivory"
                >
                  <link.icon size={15} />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10 py-5 text-center text-xs text-ivory/50">
        © {new Date().getFullYear()} DODANA. {t("rights")}
      </div>
    </footer>
  );
}
