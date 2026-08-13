"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  question: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

function AccordionItem({ question, children, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const prefersReducedMotion = useReducedMotion();
  const id = question.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`accordion-panel-${id}`}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="font-serif-display text-lg text-black">{question}</span>
        <span
          className={cn(
            "shrink-0 text-xl font-light text-gold transition-transform duration-500",
            open && "rotate-45"
          )}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`accordion-panel-${id}`}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-8 text-sm leading-relaxed text-muted">{children}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="border-t border-black/10">
      {items.map((item, i) => (
        <AccordionItem key={item.question} question={item.question} defaultOpen={i === 0}>
          {item.answer}
        </AccordionItem>
      ))}
    </div>
  );
}
