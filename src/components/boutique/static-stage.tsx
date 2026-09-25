"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import type { ShowcaseItem } from "@/lib/queries";
import { ArchFrame } from "@/components/boutique/arch-frame";
import { cn } from "@/lib/utils";

type Slot = { className: string; depth: number; float: string; sizes: string };

// Three arches on a plinth: a tall centre piece flanked by two smaller ones
// (the right one lifted). Logical start/end so the layout mirrors in RTL.
const SLOTS: Slot[] = [
  {
    className: "bottom-[16%] left-1/2 z-20 w-[46%] -translate-x-1/2 aspect-[3/4.4] sm:w-[40%]",
    depth: 18,
    float: "[animation-delay:-1s]",
    sizes: "(max-width: 1024px) 42vw, 20vw",
  },
  {
    className: "bottom-[17%] start-[5%] z-10 w-[31%] aspect-[3/4.3] sm:start-[8%] sm:w-[27%]",
    depth: 11,
    float: "[animation-delay:-3.5s]",
    sizes: "(max-width: 1024px) 30vw, 14vw",
  },
  {
    className: "bottom-[36%] end-[4%] z-10 w-[29%] aspect-[3/4.3] sm:end-[7%] sm:w-[25%]",
    depth: 26,
    float: "[animation-delay:-5.5s]",
    sizes: "(max-width: 1024px) 28vw, 13vw",
  },
];

// The 2.5D boutique stage: DODANA's real product photos in arch frames,
// layered with gentle pointer parallax and a slow float. It's the first
// paint, the phone/tablet experience and the no-WebGL fallback.
export function StaticStage({
  items,
  locale,
  motionEnabled,
  interactive = true,
  className,
}: {
  items: ShowcaseItem[];
  locale: string;
  motionEnabled: boolean;
  // false while the WebGL scene is shown over it: links leave the tab order.
  interactive?: boolean;
  className?: string;
}) {
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 60, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (!motionEnabled) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [motionEnabled, px, py]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      {/* Backdrop: a blush plaster arch with a hairline gold echo. */}
      <Layer x={sx} y={sy} depth={4} className="absolute bottom-[14%] left-1/2 h-[74%] w-[74%] -translate-x-1/2 sm:h-[80%] sm:w-[70%]">
        <span className="absolute inset-0 rounded-t-full bg-gradient-to-b from-blush-100/80 via-sand-100/70 to-transparent" />
        <span className="absolute -inset-3 rounded-t-full border border-gold-400/25 sm:-inset-4" />
      </Layer>

      {/* Plinth */}
      <Layer x={sx} y={sy} depth={6} className="absolute bottom-[7%] left-1/2 h-[13%] w-[84%] -translate-x-1/2">
        <span className="absolute inset-x-[6%] -bottom-[18%] h-[60%] rounded-[50%] bg-mocha-900/15 blur-xl" />
        <span className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-ivory-50 via-sand-200 to-sand-300 shadow-[inset_0_-10px_24px_rgba(58,38,32,0.12)]" />
        <span className="absolute inset-x-0 top-0 h-[46%] rounded-[50%] border border-gold-400/45 bg-gradient-to-b from-white to-ivory-100" />
      </Layer>

      {items.slice(0, SLOTS.length).map((item, i) => {
        const slot = SLOTS[i]!;
        const name = locale === "ar" ? item.nameAr : item.nameEn;
        return (
          <Layer key={item.id} x={sx} y={sy} depth={slot.depth} className={cn("absolute", slot.className)}>
            <div className={cn("h-full w-full", motionEnabled && "animate-float-slow", slot.float)}>
              <ArchFrame
                src={item.image}
                alt={name}
                label={name}
                href={item.href}
                sizes={slot.sizes}
                // Above the fold, and any of the three can be the LCP element.
                priority
                tabIndex={interactive ? undefined : -1}
                className="relative h-full w-full"
              />
            </div>
          </Layer>
        );
      })}
    </div>
  );
}

function Layer({
  x,
  y,
  depth,
  className,
  children,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  depth: number;
  className?: string;
  children: React.ReactNode;
}) {
  const tx = useTransform(x, (v) => v * depth);
  const ty = useTransform(y, (v) => v * depth * 0.5);
  return (
    // Outer element carries positioning/centering transforms from classes;
    // the inner one carries the parallax so they don't overwrite each other.
    <div className={className}>
      <motion.div style={{ x: tx, y: ty }} className="relative h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
