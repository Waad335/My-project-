"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export function Newsletter() {
  const t = useTranslations("home");
  const locale = useLocale();
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setStatus("error");
      setMessage(t("newsletterInvalid"));
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
      setMessage(t("newsletterSuccess"));
      setEmail("");
    } catch {
      setStatus("error");
      setMessage(t("newsletterError"));
    }
  }

  return (
    <section aria-labelledby="newsletter-title" className="container-dodana pb-4">
      <div className="studio-backdrop relative overflow-hidden rounded-[2rem] border border-mocha-700/8 px-6 py-16 text-center sm:px-12 lg:py-24">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
          <p className="eyebrow">{t("newsletterEyebrow")}</p>
          <h2 id="newsletter-title" className="section-title">
            {t("newsletterTitle")}
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-mocha-600">{t("newsletterBody")}</p>

          <form onSubmit={onSubmit} noValidate className="mt-3 w-full max-w-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-2 sm:rounded-full sm:border sm:border-mocha-700/15 sm:bg-white sm:p-1.5 sm:focus-within:border-blush-400 sm:focus-within:ring-2 sm:focus-within:ring-blush-200">
              <label htmlFor={inputId} className="sr-only">
                {t("newsletterLabel")}
              </label>
              <input
                id={inputId}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder={t("newsletterPlaceholder")}
                aria-invalid={status === "error"}
                aria-describedby={`${inputId}-status`}
                className="input-field flex-1 rounded-full sm:border-0 sm:bg-transparent sm:px-5 sm:py-2.5 sm:focus:ring-0"
              />
              <button type="submit" disabled={status === "loading"} className="btn-primary px-8 tracking-[0.14em] rtl:tracking-normal">
                {status === "loading" ? t("newsletterJoining") : t("newsletterCta")}
              </button>
            </div>
            <div id={`${inputId}-status`} aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm">
              <AnimatePresence mode="wait">
                {(status === "success" || status === "error") && (
                  <motion.p
                    key={status}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={status === "success" ? "flex items-center justify-center gap-1.5 text-mocha-700" : "text-blush-600"}
                  >
                    {status === "success" && <Check size={15} aria-hidden="true" />}
                    {message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>
          <p className="text-xs text-mocha-400">{t("newsletterFinePrint")}</p>
        </div>
      </div>
    </section>
  );
}
