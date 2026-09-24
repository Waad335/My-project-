import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { Instagram, Music2, MessageCircle } from "lucide-react";
import { navCategoryLabel } from "@/lib/categories-nav";
import { getActiveCategories, getNavCategories } from "@/lib/queries";
import { getSiteSettings } from "@/lib/settings";
import { HeartIcon } from "@/components/icons/decorative";

const INSTAGRAM_FALLBACK = "https://www.instagram.com/dodana.girls/";
const TIKTOK_FALLBACK = "https://www.tiktok.com/@dodana352";
const WHATSAPP_GROUP_FALLBACK = "https://chat.whatsapp.com/C1S3FiRHR655kXmq3gvjwn";

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-4 font-body text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-300 rtl:text-xs rtl:normal-case rtl:tracking-normal">
        {title}
      </h2>
      <ul className="flex flex-col gap-2.5 text-sm text-ivory/70">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition-colors duration-300 hover:text-ivory">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();
  const [settings, navCategories, activeCategories] = await Promise.all([
    getSiteSettings().catch(() => null),
    getNavCategories(),
    getActiveCategories(),
  ]);

  const social = [
    { icon: Instagram, label: "Instagram", href: settings?.instagramUrl || INSTAGRAM_FALLBACK },
    { icon: Music2, label: "TikTok", href: settings?.tiktokUrl || TIKTOK_FALLBACK },
    { icon: MessageCircle, label: t("whatsappGroup"), href: settings?.whatsappGroupUrl || WHATSAPP_GROUP_FALLBACK },
  ];

  const shopLinks = [
    { href: "/shop", label: tNav("shopAll") },
    { href: "/new-arrivals", label: tNav("newIn") },
    { href: "/best-sellers", label: tNav("bestSellers") },
    { href: "/wishlist", label: tNav("wishlist") },
    { href: "/account", label: tNav("account") },
    { href: "/track-order", label: tNav("trackOrder") },
  ];
  const categoryLinks = [
    ...activeCategories.map((c) => ({ href: `/category/${c.slug}`, label: locale === "ar" ? c.nameAr : c.nameEn })),
    ...navCategories.map((c) => ({ href: `/category/${c.slug}`, label: navCategoryLabel(c, locale) })),
  ];
  const aboutLinks = [
    { href: "/about", label: t("aboutUs") },
    { href: "/contact", label: t("contact") },
    { href: "/faq", label: t("faq") },
    { href: "/policies/shipping", label: t("shippingInfo") },
    { href: "/policies/returns", label: t("returns") },
  ];

  return (
    <footer className="mt-20 bg-mocha-700 text-ivory">
      <div className="container-dodana grid grid-cols-2 gap-x-8 gap-y-12 py-16 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-x-12 lg:py-20">
        <div className="col-span-2 md:col-span-4 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-1.5" aria-label="DODANA — home">
            <span className="wordmark text-3xl">DODANA</span>
            <HeartIcon className="h-3 w-3 text-blush-300" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/65">{t("about")}</p>
          <ul className="mt-6 flex items-center gap-2.5">
            {social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 text-ivory/75 transition-colors duration-300 hover:border-gold-300 hover:text-gold-300"
                >
                  <s.icon size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <FooterColumn title={t("shop")} links={shopLinks} />
        <FooterColumn title={t("categories")} links={categoryLinks} />
        <FooterColumn title={t("company")} links={aboutLinks} />
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-dodana flex flex-col items-center justify-between gap-3 py-6 text-xs text-ivory/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} DODANA. {t("rights")}
          </p>
          <ul className="flex items-center gap-5">
            <li>
              <Link href="/privacy" className="transition-colors hover:text-ivory">
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-ivory">
                {t("terms")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
