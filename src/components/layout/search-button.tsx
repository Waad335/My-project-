"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import type { ProductCardData } from "@/lib/serialize";
import { getSearchSuggestions } from "@/lib/search-actions";
import { DodanaImage } from "@/components/ui/dodana-image";
import { formatEGP } from "@/lib/utils";

const DEBOUNCE_MS = 300;

export function SearchButton() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("search");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else {
      setValue("");
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const suggestions = await getSearchSuggestions(query);
      if (requestId.current === id) {
        setResults(suggestions);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  function goToResults(query: string) {
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToResults(value.trim());
  }

  const query = value.trim();
  const showDropdown = query.length >= 2;

  return (
    <>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-mocha-700 transition hover:bg-mocha-700/5"
      >
        <Search size={19} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col items-stretch bg-mocha-900/30 backdrop-blur-sm">
            <button aria-label="Close search" className="absolute inset-0" onClick={() => setOpen(false)} />
            <div className="relative max-h-[85vh] overflow-y-auto border-b border-mocha-700/10 bg-ivory shadow-soft-lg animate-fade-up">
              <form onSubmit={handleSubmit} className="container-dodana flex items-center gap-3 py-5">
                <Search size={20} className="flex-shrink-0 text-mocha-400" />
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={t("placeholder")}
                  className="flex-1 bg-transparent font-heading text-lg text-mocha-700 outline-none placeholder:text-mocha-300"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close search"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-mocha-500 hover:bg-mocha-700/5"
                >
                  <X size={18} />
                </button>
              </form>

              {showDropdown && (
                <div className="container-dodana pb-5">
                  {loading ? (
                    <p className="px-1 py-4 text-sm text-mocha-400">{tc("loading")}</p>
                  ) : results.length > 0 ? (
                    <>
                      <ul className="flex flex-col gap-1">
                        {results.map((product) => {
                          const name = locale === "ar" ? product.nameAr : product.nameEn;
                          return (
                            <li key={product.id}>
                              <Link
                                href={`/product/${product.slug}`}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 rounded-xl px-1 py-2 transition hover:bg-mocha-700/5"
                              >
                                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-ivory-200">
                                  <DodanaImage
                                    src={product.image}
                                    alt={name}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                </div>
                                <span className="line-clamp-1 flex-1 text-start text-sm text-mocha-700">{name}</span>
                                <span className="flex-shrink-0 text-sm font-semibold text-mocha-700">
                                  {formatEGP(product.effectivePrice, locale)}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                      <button
                        type="button"
                        onClick={() => goToResults(query)}
                        className="mt-2 w-full rounded-xl px-1 py-2.5 text-center text-sm font-semibold text-gold-600 transition hover:bg-mocha-700/5"
                      >
                        {tc("viewAll")}
                      </button>
                    </>
                  ) : (
                    <p className="px-1 py-4 text-sm text-mocha-400">{tc("noResults")}</p>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
