"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShopFilters } from "./ShopFilters";
import { DURATION, EASE_LUXURY } from "@/lib/motion";
import type { ShopifyCollection } from "@/types/shopify";

/**
 * Mobile/tablet (below `lg`) replacement for the desktop filter sidebar.
 * A compact "Filters" trigger opens a drawer that reuses the exact same
 * <ShopFilters> — same query-param contract, same filtering logic — inside
 * an overlay that mirrors CartDrawer's interaction pattern (backdrop, slide
 * from the right, Escape to close, scroll lock, focus management).
 */
export function ShopFilterDrawer({ collections }: { collections: ShopifyCollection[] }) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const activeCount = ["q", "collection", "min", "max", "sort"].filter((key) =>
    Boolean(searchParams.get(key))
  ).length;

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      headingRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="mb-8 lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="shop-filter-drawer"
        className="inline-flex items-center gap-2 border border-black/20 px-5 py-3 text-xs uppercase tracking-[0.18em] hover:border-black"
      >
        <FilterIcon />
        Filters
        {activeCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-semibold text-black">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : DURATION.fast }}
              onClick={close}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px]"
              aria-hidden="true"
            />
            <motion.aside
              id="shop-filter-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Filter and sort products"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: prefersReducedMotion ? 0 : DURATION.base, ease: EASE_LUXURY }}
              className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-sm flex-col overflow-y-auto bg-ivory shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-black/10 px-6 py-6">
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-serif-display text-2xl outline-none"
                >
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close filters"
                  className="relative flex h-6 w-6 items-center justify-center"
                >
                  <span className="absolute h-px w-5 rotate-45 bg-current" />
                  <span className="absolute h-px w-5 -rotate-45 bg-current" />
                </button>
              </div>

              <div className="flex-1 px-6 py-6">
                <ShopFilters collections={collections} />
              </div>

              <div className="border-t border-black/10 px-6 py-6">
                <button
                  type="button"
                  onClick={close}
                  className="w-full bg-black py-3.5 text-xs uppercase tracking-[0.08em] text-ivory hover:bg-brown"
                >
                  View Results
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M8 12h8M11 18h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
