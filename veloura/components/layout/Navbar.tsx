"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { useCartStore, useUiStore } from "@/lib/store";
import { MobileMenu } from "./MobileMenu";
import { DURATION, EASE_LUXURY } from "@/lib/motion";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const { openCart } = useUiStore();
  const { cart, hydrate } = useCartStore();
  const prefersReducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setSearchOpen(false);
    router.push(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/shop");
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = isHome && !scrolled && !mobileOpen;
  const itemCount = cart?.totalQuantity ?? 0;

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          backgroundColor: transparent ? "rgba(250,247,242,0)" : "rgba(250,247,242,0.92)",
          borderColor: transparent ? "rgba(20,18,15,0)" : "rgba(20,18,15,0.08)",
        }}
        transition={{ duration: prefersReducedMotion ? 0 : DURATION.base, ease: EASE_LUXURY }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-colors",
          transparent ? "text-ivory" : "text-black"
        )}
      >
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-10 lg:px-14">
          <Link
            href="/"
            className="font-serif-display text-xl font-medium tracking-[0.2em]"
            aria-label="VELOURA — Home"
          >
            {SITE_NAME}
          </Link>

          <ul className="hidden items-center gap-10 text-xs font-medium uppercase tracking-[0.18em] lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "relative py-1 transition-opacity hover:opacity-70",
                    pathname === link.href && "opacity-100"
                  )}
                >
                  {link.label}
                  {pathname === link.href && (
                    <span className="absolute -bottom-0.5 left-0 h-px w-full bg-current" />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label={searchOpen ? "Close search" : "Search products"}
              aria-expanded={searchOpen}
              aria-controls="site-search-panel"
              className="hidden text-xs uppercase tracking-[0.18em] hover:opacity-70 lg:inline-flex"
            >
              {searchOpen ? "Close" : "Search"}
            </button>
            <Link href="/account" aria-label="Account" className="hidden lg:inline-flex hover:opacity-70">
              <UserIcon />
            </Link>
            <button
              type="button"
              onClick={openCart}
              aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
              className="relative flex items-center hover:opacity-70"
            >
              <BagIcon />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-semibold text-black">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex flex-col gap-1.5 lg:hidden"
            >
              <span className="block h-px w-6 bg-current" />
              <span className="block h-px w-6 bg-current" />
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              id="site-search-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : DURATION.fast, ease: EASE_LUXURY }}
              className="overflow-hidden border-t border-black/10 bg-ivory text-black shadow-lg"
            >
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-5 md:px-10 lg:px-14"
              >
                <SearchIcon />
                <label htmlFor="site-search-input" className="sr-only">
                  Search products
                </label>
                <input
                  ref={searchInputRef}
                  id="site-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resume templates, brand kits, planners…"
                  className="w-full bg-transparent font-serif-display text-xl placeholder:text-muted/70 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 text-xs uppercase tracking-[0.16em] text-gold-deep hover:text-black"
                >
                  Search
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-muted">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M19 19l-4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 8h12l-1 12.5a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9L6 8Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 20c1.2-3.8 4.2-6 7-6s5.8 2.2 7 6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
