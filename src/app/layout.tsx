import type { Metadata } from "next";
import { Fraunces, DM_Sans, Cairo } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";
import { defaultLocale, isRtl, localeCookieName, locales, type Locale } from "@/i18n/config";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppFloatButton } from "@/components/layout/whatsapp-float-button";
import { ConditionalChrome } from "@/components/layout/conditional-chrome";
import { getSiteSettings } from "@/lib/settings";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DODANA — Good taste, already found.",
    template: "%s | DODANA",
  },
  description:
    "DODANA — curated skincare, haircare, perfumes, accessories and bags. لقيناها عشانك، قبل ما تدوري.",
  openGraph: {
    type: "website",
    siteName: "DODANA",
    title: "DODANA — Good taste, already found.",
    description: "Curated skincare, haircare, perfumes, accessories & bags across Egypt.",
    locale: "en_US",
    alternateLocale: "ar_EG",
  },
  twitter: {
    card: "summary_large_image",
    title: "DODANA — Good taste, already found.",
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLocale = cookies().get(localeCookieName)?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale) ? (cookieLocale as Locale) : defaultLocale;
  const messages = await getMessages();
  const settings = await getSiteSettings().catch(() => null);

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
      <body className={`${fraunces.variable} ${dmSans.variable} ${cairo.variable} font-body`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>
            <ConditionalChrome
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
