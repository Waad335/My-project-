"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ items }: { items: { title: string; content: React.ReactNode }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col divide-y divide-mocha-700/10 rounded-card border border-mocha-700/10 bg-white">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-mocha-700">{item.title}</span>
              <ChevronDown size={18} className={cn("flex-shrink-0 text-mocha-400 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && <div className="px-5 pb-4 text-sm leading-relaxed text-mocha-500">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
