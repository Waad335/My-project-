"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

export function SearchButton() {
  const router = useRouter();
  const t = useTranslations("search");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = value.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
  }

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
            <div className="relative border-b border-mocha-700/10 bg-ivory shadow-soft-lg animate-fade-up">
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
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
