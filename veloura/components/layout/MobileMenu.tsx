"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[60] flex flex-col bg-black text-ivory"
        >
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-5 md:px-10">
            <span className="font-serif-display text-xl tracking-[0.2em]">{SITE_NAME}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="relative flex h-6 w-6 items-center justify-center"
            >
              <span className="absolute h-px w-6 rotate-45 bg-current" />
              <span className="absolute h-px w-6 -rotate-45 bg-current" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-2 px-8">
            {NAV_LINKS.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: prefersReducedMotion ? 0 : 0.15 + i * 0.06,
                  duration: prefersReducedMotion ? 0 : 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="font-serif-display block py-2 text-4xl transition-colors hover:text-gold sm:text-6xl"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="flex justify-between px-8 pb-10 text-xs uppercase tracking-[0.2em] text-ivory/60">
            <Link href="/account" onClick={onClose}>
              Account
            </Link>
            <a href="mailto:hello@veloura.com">hello@veloura.com</a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
