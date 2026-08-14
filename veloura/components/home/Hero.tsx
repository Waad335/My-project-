"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Scene3D } from "@/components/3d/Scene3D";
import { Button } from "@/components/ui/Button";
import { SITE_TAGLINE } from "@/lib/constants";
import { DURATION, EASE_LUXURY } from "@/lib/motion";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 120]);
  const scrimOpacity = useTransform(scrollYProgress, [0, 1], [0.55, 0.85]);

  return (
    <section ref={ref} className="relative flex h-[100svh] min-h-[640px] w-full items-center justify-center overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#3a2c1e_0%,#14120f_65%,#0a0908_100%)]" />
      <Scene3D variant="hero" className="absolute inset-0" />
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: scrimOpacity }} aria-hidden="true" />

      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-7 px-6 text-center text-ivory"
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : DURATION.slow, ease: EASE_LUXURY }}
          className="text-[11px] uppercase tracking-[0.5em] text-gold-soft"
        >
          Est. Digital Atelier
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: prefersReducedMotion ? 0 : DURATION.slow, delay: 0.1, ease: EASE_LUXURY }}
          className="font-serif-display text-balance text-6xl font-medium leading-[1.02] sm:text-7xl md:text-8xl"
        >
          VELOURA
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : DURATION.slow, delay: 0.28, ease: EASE_LUXURY }}
          className="font-serif-display text-balance text-2xl italic text-ivory/90 sm:text-3xl"
        >
          {SITE_TAGLINE}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : DURATION.slow, delay: 0.4, ease: EASE_LUXURY }}
          className="max-w-lg text-balance text-sm leading-relaxed text-ivory/65 sm:text-base"
        >
          Premium digital resources designed for ambitious creators and modern professionals —
          resume systems, brand kits, and planners built to feel as considered as the work they support.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : DURATION.slow, delay: 0.55, ease: EASE_LUXURY }}
          className="mt-3 flex flex-col gap-4 sm:flex-row"
        >
          <Button href="/shop" size="lg" variant="light">
            Explore Collection
          </Button>
          <Button href="/about" size="lg" variant="outlineLight">
            Our Philosophy
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: DURATION.slow }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-ivory/60"
        aria-hidden="true"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <motion.span
          className="h-9 w-px bg-ivory/40"
          animate={prefersReducedMotion ? undefined : { scaleY: [0.3, 1, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  );
}
