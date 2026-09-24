"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ShowcaseItem } from "@/lib/queries";
import { ArchFrame } from "@/components/boutique/arch-frame";

type ShowcaseEditorialProps = {
  eyebrow: string;
  title: string;
  lines: [string, string, string];
  cta: { href: string; label: string };
  items: ShowcaseItem[];
  locale: string;
};

// Pinned, scroll-driven editorial built from DODANA's real imagery: the
// arches drift at different depths, a gold line draws itself and the copy
// steps through — cinematic, but no WebGL and nothing invented.
export function ShowcaseEditorial({ eyebrow, title, lines, cta, items, locale }: ShowcaseEditorialProps) {
  const section = useRef<HTMLElement>(null);
  const reduced = Boolean(useReducedMotion());
  const { scrollYProgress: p } = useScroll({ target: section, offset: ["start start", "end end"] });

  // Reduced motion: everything holds still (m = 0); only the copy fades.
  const m = reduced ? 0 : 1;
  const mainScale = useTransform(p, [0, 1], [1 - 0.06 * m, 1 + 0.04 * m]);
  const mainY = useTransform(p, [0, 1], [30 * m, -30 * m]);
  const leftY = useTransform(p, [0, 1], [50 * m, -40 * m]);
  const rightY = useTransform(p, [0, 1], [-30 * m, 45 * m]);
  const arc = useTransform(p, [0.05, 0.85], [reduced ? 1 : 0, 1]);
  const sweep = useTransform(p, [0, 1], reduced ? ["-200%", "-200%"] : ["-60%", "160%"]);

  const [main, left, right] = items;
  const name = (item: ShowcaseItem) => (locale === "ar" ? item.nameAr : item.nameEn);

  return (
    <section ref={section} aria-labelledby="showcase-title" className="relative h-[210svh] bg-sand-100 lg:h-[230svh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_65%_50%,rgba(245,222,220,0.9)_0%,rgba(245,222,220,0)_70%)]" />

        <div className="container-dodana relative grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-4 pb-8 pt-32 sm:pt-36 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-1 lg:items-center lg:gap-12 lg:pb-12 lg:pt-28">
          {/* Copy */}
          <div className="flex flex-col gap-4 lg:gap-6">
            <p className="eyebrow flex items-center gap-3">
              <span className="h-px w-8 bg-gold-400" aria-hidden="true" />
              {eyebrow}
            </p>
            <h2
              id="showcase-title"
              className="text-balance font-heading text-[2.4rem] leading-[1.02] text-mocha-700 sm:text-6xl lg:text-7xl rtl:leading-[1.25]"
            >
              {title}
            </h2>
            <ol className="relative mt-2 hidden min-h-[4rem] max-w-sm lg:block">
              {lines.map((line, i) => (
                <StepLine key={line} index={i} line={line} progress={p} reduced={reduced} />
              ))}
            </ol>
            <Link href={cta.href} className="btn-primary mt-2 hidden w-fit px-8 py-3.5 lg:inline-flex">
              {cta.label}
              <ArrowRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
            </Link>
          </div>

          {/* Imagery: a square box sized to fit either the width or the
              height, with the arches positioned in % inside it. */}
          <div className="flex min-h-0 items-center justify-center lg:h-full">
            <div className="relative aspect-square w-full max-w-[min(100%,52svh)] lg:max-w-[min(100%,76svh)]">
              <svg viewBox="0 0 400 400" className="pointer-events-none absolute inset-0 h-full w-full text-gold-400" aria-hidden="true">
                <motion.circle
                  cx="200"
                  cy="200"
                  r="188"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  style={{ pathLength: arc, rotate: -90 }}
                  opacity={0.7}
                />
              </svg>

              {main && (
                <div className="absolute left-1/2 top-1/2 z-20 aspect-[3/4.4] w-[46%] -translate-x-1/2 -translate-y-1/2">
                  <motion.div style={{ scale: mainScale, y: mainY }} className="relative h-full w-full">
                    <ArchFrame
                      src={main.image}
                      alt={name(main)}
                      label={name(main)}
                      href={main.href}
                      sizes="(max-width: 1024px) 45vw, 22vw"
                      className="relative h-full w-full"
                    />
                    {/* light sweep across the photo */}
                    <span className="pointer-events-none absolute inset-[6px] overflow-hidden rounded-t-full rounded-b-[10px]">
                      <motion.span
                        aria-hidden="true"
                        style={{ x: sweep }}
                        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                      />
                    </span>
                  </motion.div>
                </div>
              )}
              {left && (
                <motion.div style={{ y: leftY }} className="absolute bottom-[4%] start-[3%] z-10 aspect-[3/4.2] w-[29%]">
                  <ArchFrame
                    src={left.image}
                    alt={name(left)}
                    label={name(left)}
                    href={left.href}
                    sizes="(max-width: 1024px) 28vw, 14vw"
                    className="relative h-full w-full"
                  />
                </motion.div>
              )}
              {right && (
                <motion.div style={{ y: rightY }} className="absolute end-[3%] top-[4%] z-10 aspect-[3/4.2] w-[27%]">
                  <ArchFrame
                    src={right.image}
                    alt={name(right)}
                    label={name(right)}
                    href={right.href}
                    sizes="(max-width: 1024px) 26vw, 13vw"
                    className="relative h-full w-full"
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Small screens: steps + CTA under the imagery */}
          <div className="flex flex-col items-start gap-4 lg:hidden">
            <ol className="relative min-h-[3rem] w-full">
              {lines.map((line, i) => (
                <StepLine key={line} index={i} line={line} progress={p} reduced={reduced} />
              ))}
            </ol>
            {/* start-aligned so it never sits under the floating WhatsApp button */}
            <Link href={cta.href} className="btn-primary px-6 py-3">
              {cta.label}
              <ArrowRight size={15} aria-hidden="true" className="rtl:-scale-x-100" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEP_RANGES: [number, number, number, number][] = [
  [-0.1, 0, 0.3, 0.38],
  [0.32, 0.4, 0.62, 0.7],
  [0.64, 0.72, 1, 1.1],
];

function StepLine({ index, line, progress, reduced }: { index: number; line: string; progress: MotionValue<number>; reduced: boolean }) {
  const range = STEP_RANGES[index] ?? [0, 0, 1, 1];
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, reduced ? [0, 0, 0, 0] : [14, 0, 0, -14]);
  return (
    <motion.li
      style={{ opacity, y }}
      className={`flex items-baseline gap-4 text-base leading-snug text-mocha-700 sm:text-xl ${index > 0 ? "absolute inset-x-0 top-0" : ""}`}
    >
      <span className="font-heading text-sm text-gold-600">{String(index + 1).padStart(2, "0")}</span>
      <span className="font-heading">{line}</span>
    </motion.li>
  );
}
