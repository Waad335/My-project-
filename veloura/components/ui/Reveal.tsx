"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { DURATION, EASE_LUXURY } from "@/lib/motion";

type Direction = "up" | "down" | "left" | "right" | "none";

/** 18px — mid-point of the 16-20px "subtle, not a slide" offset range. */
const REVEAL_OFFSET = 18;

const distanceFor = (direction: Direction) => {
  switch (direction) {
    case "up":
      return { y: REVEAL_OFFSET };
    case "down":
      return { y: -REVEAL_OFFSET };
    case "left":
      return { x: REVEAL_OFFSET };
    case "right":
      return { x: -REVEAL_OFFSET };
    default:
      return {};
  }
};

interface RevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  blur?: boolean;
  once?: boolean;
  amount?: number;
  as?: "div" | "span";
}

/** Scroll-triggered fade + slide (+ optional blur) reveal, luxury timing, reduced-motion aware. */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = DURATION.base,
  className,
  blur = false,
  once = true,
  amount = 0.3,
  as = "div",
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const offset = distanceFor(direction);

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...offset,
      filter: blur ? "blur(8px)" : "blur(0px)",
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: EASE_LUXURY,
      },
    },
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial={prefersReducedMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once, amount }}
      variants={prefersReducedMotion ? undefined : variants}
    >
      {children}
    </MotionTag>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  once?: boolean;
  amount?: number;
}

export function StaggerGroup({ children, className, stagger = 0.12, once = true, amount = 0.2 }: StaggerProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : stagger,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
}) {
  const prefersReducedMotion = useReducedMotion();
  const offset = distanceFor(direction);
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, ...offset },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: prefersReducedMotion ? 0 : DURATION.base, ease: EASE_LUXURY },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
