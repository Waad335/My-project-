"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";

const TESTIMONIALS = [
  {
    quote: "Beautifully designed and incredibly easy to customize. My resume finally looks like the work I actually do.",
    name: "Amara Osei",
    role: "Verified Customer",
  },
  {
    quote: "I've bought a dozen template packs over the years — this is the first one that felt like a design studio made it, not a template mill.",
    name: "Jonas Bergström",
    role: "Verified Customer",
  },
  {
    quote: "The brand kit gave my studio a visual identity in an afternoon that would've taken weeks to commission.",
    name: "Priya Nandakumar",
    role: "Verified Customer",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  const current = TESTIMONIALS[index];

  return (
    <section className="bg-black py-24 text-ivory md:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <p className="mb-10 text-xs uppercase tracking-[0.24em] text-gold-soft">Testimonials</p>
        </Reveal>

        <div className="relative min-h-[200px] sm:min-h-[160px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -16 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-serif-display text-balance text-2xl italic leading-snug sm:text-3xl">
                &ldquo;{current.quote}&rdquo;
              </p>
              <footer className="mt-6 text-sm text-ivory/60">
                <span className="text-ivory">{current.name}</span> &middot; {current.role}
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex justify-center gap-2" role="tablist" aria-label="Testimonials">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              role="tab"
              aria-selected={i === index}
              aria-label={`Show testimonial from ${t.name}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? "w-8 bg-gold" : "w-1.5 bg-ivory/25"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
