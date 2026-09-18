import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { NAV_LABEL_OVERRIDE } from "@/lib/categories-nav";
import { getNavCategories } from "@/lib/queries";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CategoryNavItem } from "@/components/layout/category-nav-item";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { CartIconButton } from "@/components/layout/cart-icon-button";
import { WishlistIconButton } from "@/components/layout/wishlist-icon-button";
import { SearchButton } from "@/components/layout/search-button";
import { getSiteSettings } from "@/lib/settings";
import { HeartIcon } from "@/components/icons/decorative";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const [settings, navCategories] = await Promise.all([
    getSiteSettings().catch(() => null),
    getNavCategories(),
  ]);
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
            navCategories={navCategories}
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
          {navCategories.map((cat) => {
            const override = NAV_LABEL_OVERRIDE[cat.slug];
            const label = override ? (locale === "ar" ? override.ar : override.en) : locale === "ar" ? cat.nameAr : cat.nameEn;
            return <CategoryNavItem key={cat.id} category={cat} label={label} />;
          })}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <LocaleSwitcher className="hidden sm:inline-flex" />
          <SearchButton />
          <div className="hidden lg:block">
            <WishlistIconButton />
          </div>
          <CartIconButton />
        </div>
      </div>
    </header>
  );
}
