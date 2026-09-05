import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { NAV_CATEGORIES } from "@/lib/categories-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { CartIconButton } from "@/components/layout/cart-icon-button";
import { getSiteSettings } from "@/lib/settings";
import { HeartIcon } from "@/components/icons/decorative";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const settings = await getSiteSettings().catch(() => null);
  const announcement = locale === "ar" ? settings?.announcementAr : settings?.announcementEn;

  return (
    <header className="sticky top-0 z-30 border-b border-mocha-700/8 bg-ivory/90 backdrop-blur-md">
      {announcement && (
        <div className="bg-mocha-700 px-4 py-2 text-center text-xs font-medium text-ivory">
          {announcement}
        </div>
      )}
      <div className="container-dodana flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2 lg:hidden">
          <MobileNav
            instagramUrl={settings?.instagramUrl || "https://www.instagram.com/dodana.girls/"}
            whatsappGroupUrl={settings?.whatsappGroupUrl || "https://chat.whatsapp.com/C1S3FiRHR655kXmq3gvjwn"}
          />
        </div>

        <Link href="/" className="flex items-center gap-1.5">
          <span className="font-heading text-2xl tracking-wide text-mocha-700">DODANA</span>
          <HeartIcon className="h-3 w-3 text-blush-400" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <Link href="/" className="text-sm font-medium text-mocha-600 transition hover:text-mocha-800">
            {t("home")}
          </Link>
          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="text-sm font-medium text-mocha-600 transition hover:text-mocha-800"
            >
              {t(cat.labelKey)}
            </Link>
          ))}
          <Link href="/new-arrivals" className="text-sm font-medium text-mocha-600 transition hover:text-mocha-800">
            {t("newArrivals")}
          </Link>
          <Link href="/best-sellers" className="text-sm font-medium text-mocha-600 transition hover:text-mocha-800">
            {t("bestSellers")}
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LocaleSwitcher className="hidden sm:inline-flex" />
          <CartIconButton />
        </div>
      </div>
    </header>
  );
}
