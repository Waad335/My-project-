import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans, Cairo } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { defaultLocale, isRtl, localeCookieName, locales, type Locale } from "@/i18n/config";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppFloatButton } from "@/components/layout/whatsapp-float-button";
import { ConditionalChrome } from "@/components/layout/conditional-chrome";
import { getSiteSettings } from "@/lib/settings";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { SITE_URL } from "@/lib/site";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const DESCRIPTION =
  "DODANA — curated skincare, haircare, perfumes, accessories and bags, carefully selected in Saudi Arabia and delivered across Egypt.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DODANA — Beauty, but make it yours.",
    template: "%s | DODANA",
  },
  description: DESCRIPTION,
  applicationName: "DODANA",
  keywords: ["DODANA", "skincare Egypt", "perfumes Egypt", "Saudi beauty", "haircare", "accessories", "bags", "EGP"],
  openGraph: {
    type: "website",
    siteName: "DODANA",
    title: "DODANA — Beauty, but make it yours.",
    description: DESCRIPTION,
    locale: "en_US",
    alternateLocale: "ar_EG",
    images: [{ url: "/hero/hero-visual.png", width: 1312, height: 1199, alt: "DODANA beauty edit" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DODANA — Beauty, but make it yours.",
    description: DESCRIPTION,
    images: ["/hero/hero-visual.png"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#FBF5EF",
  width: "device-width",
  initialScale: 1,
};

// Organization + WebSite (with site search) structured data, on every page.
const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DODANA",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    sameAs: ["https://www.instagram.com/dodana.girls/", "https://www.tiktok.com/@dodana352"],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DODANA",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/shop?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLocale = cookies().get(localeCookieName)?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale) ? (cookieLocale as Locale) : defaultLocale;
  const messages = await getMessages();
  const tCommon = await getTranslations("common");
  const [settings, customer] = await Promise.all([getSiteSettings().catch(() => null), getCurrentCustomer()]);

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
      <body className={`${fraunces.variable} ${dmSans.variable} ${cairo.variable} font-body`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders customerId={customer?.id ?? null}>
            <ConditionalChrome
              skipLabel={tCommon("skipToContent")}
              header={<SiteHeader />}
              footer={<SiteFooter />}
              whatsapp={<WhatsAppFloatButton number={settings?.whatsappNumber} />}
            >
              {children}
            </ConditionalChrome>
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
