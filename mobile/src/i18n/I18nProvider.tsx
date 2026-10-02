import type { ReactNode } from "react";
import { IntlProvider } from "use-intl";
import { isRtl, type Locale } from "./config";
import { useLocaleStore } from "./locale-store";
import { messages } from "./messages";

// Prices and dates follow the store's market.
const TIME_ZONE = "Africa/Cairo";

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  return (
    <IntlProvider
      locale={locale}
      messages={messages[locale]}
      timeZone={TIME_ZONE}
      onError={(error) => {
        if (__DEV__) console.warn(`[i18n] ${error.message}`);
      }}
      getMessageFallback={({ namespace, key }) => [namespace, key].filter(Boolean).join(".")}
    >
      {children}
    </IntlProvider>
  );
}

export function useLocale(): Locale {
  return useLocaleStore((s) => s.locale);
}

// Use this rather than I18nManager.isRTL, which is always false on the web.
export function useIsRtl(): boolean {
  return isRtl(useLocale());
}
