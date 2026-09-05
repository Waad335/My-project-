"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/lib/locale-actions";
import type { Locale } from "@/i18n/config";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next: Locale = locale === "ar" ? "en" : "ar";
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`rounded-full border border-mocha-700/15 px-3 py-1.5 text-xs font-semibold text-mocha-600 transition hover:border-gold-400 hover:text-gold-500 disabled:opacity-50 ${className}`}
      aria-label="Switch language"
    >
      {locale === "ar" ? "EN" : "AR"}
    </button>
  );
}
