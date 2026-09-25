import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { getActiveCategories, getNavCategories } from "@/lib/queries";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CategoriesMenu } from "@/components/layout/categories-menu";
import { NavLink } from "@/components/layout/nav-link";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { CartIconButton } from "@/components/layout/cart-icon-button";
import { WishlistIconButton } from "@/components/layout/wishlist-icon-button";
import { AccountIconButton } from "@/components/layout/account-icon-button";
import { SearchButton } from "@/components/layout/search-button";
import { getSiteSettings } from "@/lib/settings";
import { HeartIcon } from "@/components/icons/decorative";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const [settings, navCategories, activeCategories, customer] = await Promise.all([
    getSiteSettings().catch(() => null),
    getNavCategories(),
    getActiveCategories(),
    getCurrentCustomer(),
  ]);
  const announcement = locale === "ar" ? settings?.announcementAr : settings?.announcementEn;
  const shopCategories = activeCategories.map(({ id, slug, nameEn, nameAr, image }) => ({ id, slug, nameEn, nameAr, image }));
  const primaryLinks = [
    { href: "/shop", label: t("shop") },
    { href: "/new-arrivals", label: t("newIn") },
    { href: "/best-sellers", label: t("bestSellers") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-mocha-700/8 bg-ivory/90 backdrop-blur-md">
      {announcement && (
        <div className="bg-mocha-700 px-4 py-2 text-center text-xs font-medium text-ivory">{announcement}</div>
      )}
      <div className="container-dodana flex h-16 items-center justify-between gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="flex items-center gap-1.5" aria-label="DODANA — home">
          <span className="wordmark text-2xl text-mocha-700">DODANA</span>
          <HeartIcon className="h-3 w-3 text-blush-400" />
        </Link>

        <nav aria-label={t("mainNavigation")} className="hidden items-center gap-8 lg:flex">
          {primaryLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
          <CategoriesMenu label={t("categories")} departments={navCategories} shopCategories={shopCategories} />
          <NavLink href="/about">{t("about")}</NavLink>
        </nav>

        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <LocaleSwitcher className="me-1 hidden sm:inline-flex" />
          <SearchButton />
          <div className="hidden lg:block">
            <WishlistIconButton />
          </div>
          <div className="hidden lg:block">
            <AccountIconButton label={t("account")} initial={customer?.name?.trim().charAt(0) || null} />
          </div>
          <CartIconButton />
          <MobileNav
            navCategories={navCategories}
            shopCategories={shopCategories}
            signedIn={Boolean(customer)}
            instagramUrl={settings?.instagramUrl || "https://www.instagram.com/dodana.girls/"}
            tiktokUrl={settings?.tiktokUrl || "https://www.tiktok.com/@dodana352"}
            whatsappGroupUrl={settings?.whatsappGroupUrl || "https://chat.whatsapp.com/C1S3FiRHR655kXmq3gvjwn"}
          />
        </div>
      </div>
    </header>
  );
}
