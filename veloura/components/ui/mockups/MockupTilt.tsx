"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { PointerEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared 3D-perspective + pointer-tracked tilt wrapper used by every product
 * category mockup. Keeps the "premium floating object" interaction identical
 * across categories instead of five one-off implementations.
 */
export function MockupTilt({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 220, damping: 20 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-10, 10]), { stiffness: 220, damping: 20 });
  const scale = useSpring(1, { stiffness: 220, damping: 20 });

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
    scale.set(1.03);
  }

  function handlePointerLeave() {
    x.set(0.5);
    y.set(0.5);
    scale.set(1);
  }

  return (
    <div
      className={cn("relative h-full w-full", className)}
      style={{ perspective: 1000 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className="h-full w-full"
        style={
          prefersReducedMotion
            ? undefined
            : { rotateX, rotateY, scale, transformStyle: "preserve-3d" }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
