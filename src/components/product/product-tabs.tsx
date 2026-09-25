"use client";

import { useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tab = { id: string; label: string; content: React.ReactNode };

// WAI-ARIA tabs: arrow keys / Home / End move between tabs.
export function ProductTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const baseId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const rtl = document.documentElement.dir === "rtl";
    const nextKey = rtl ? "ArrowLeft" : "ArrowRight";
    const prevKey = rtl ? "ArrowRight" : "ArrowLeft";
    let next = -1;
    if (e.key === nextKey) next = (index + 1) % tabs.length;
    else if (e.key === prevKey) next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    setActive(tab.id);
    buttons.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="-mx-4 flex gap-8 overflow-x-auto border-b border-mocha-700/10 px-4 scrollbar-hide sm:mx-0 sm:px-0">
        {tabs.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              id={`${baseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative shrink-0 pb-4 pt-1 text-[15px] font-medium transition-colors",
                selected ? "text-mocha-800" : "text-mocha-500 hover:text-mocha-700"
              )}
            >
              {tab.label}
              {selected && (
                <motion.span
                  layoutId={`${baseId}-underline`}
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-mocha-700"
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${baseId}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="pt-8 focus-visible:outline-offset-8"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
