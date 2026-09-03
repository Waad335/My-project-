"use server";

import { cookies } from "next/headers";
import { localeCookieName, locales, type Locale } from "@/i18n/config";

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) return;
  cookies().set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
