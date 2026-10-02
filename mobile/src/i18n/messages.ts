// The app's text: the website's own English/Arabic files, used unchanged,
// plus a small "app" namespace for the few strings only the app needs.
import websiteEn from "@shared/messages/en.json";
import websiteAr from "@shared/messages/ar.json";
import appEn from "./messages/app.en.json";
import appAr from "./messages/app.ar.json";
import type { Locale } from "./config";

const en = { ...websiteEn, app: appEn };
const ar = { ...websiteAr, app: appAr };

export type Messages = typeof en;

export const messages: Record<Locale, Messages> = { en, ar };

// Lets use-intl check translation keys at compile time.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}
