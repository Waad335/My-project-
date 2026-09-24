"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CanvasErrorBoundary } from "@/components/3d/CanvasErrorBoundary";
import { use3DCapability } from "@/hooks/use-3d-capability";

const ShowcaseScene = dynamic(() => import("@/components/3d/ShowcaseScene"), { ssr: false });

type Showcase3DProps = {
  eyebrow: string;
  title: string;
  lines: [string, string, string];
  cta: { href: string; label: string };
  fallbackImage: string;
  fallbackAlt: string;
};

// Pinned, scroll-driven product moment: the section is ~2.4 viewports tall,
// the stage sticks while the bottle turns and the copy steps through.
export function Showcase3D({ eyebrow, title, lines, cta, fallbackImage, fallbackAlt }: Showcase3DProps) {
  const section = useRef<HTMLElement>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const { webgl, quality, layout } = use3DCapability();
  // Start loading a little before the section arrives.
  const near = useInView(section, { margin: "600px 0px 600px 0px" });
  const visible = useInView(section, { margin: "0px" });
  const [failed, setFailed] = useState(false);
  const [mountedOnce, setMountedOnce] = useState(false);
  if (near && !mountedOnce) setMountedOnce(true);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const show3D = webgl === true && mountedOnce && !failed;

  return (
    <section ref={section} aria-labelledby="showcase-title" className="relative h-[240svh] bg-sand-100">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_45%,rgba(245,222,220,0.85)_0%,rgba(245,222,220,0)_70%)]" />

        {/* Stage */}
        <div className="absolute inset-0" aria-hidden="true">
          {show3D ? (
            <CanvasErrorBoundary fallback={<ReportFailure onFail={() => setFailed(true)} />}>
              <ShowcaseScene
                quality={quality}
                layout={layout}
                reducedMotion={reducedMotion}
                active={visible}
                progress={scrollYProgress}
              />
            </CanvasErrorBoundary>
          ) : (
            webgl === false || failed ? <FallbackArt src={fallbackImage} alt={fallbackAlt} progress={scrollYProgress} /> : null
          )}
        </div>

        <div className="container-dodana pointer-events-none relative flex h-full flex-col justify-between py-16 lg:py-20">
          <div className="max-w-md">
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="showcase-title" className="mt-4 font-heading text-[2.6rem] leading-[1.02] text-mocha-700 sm:text-6xl lg:text-7xl rtl:leading-[1.25]">
              {title}
            </h2>
          </div>

          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <ol className="relative flex min-h-[3.5rem] max-w-sm flex-col">
              {lines.map((line, i) => (
                <StepLine key={line} index={i} line={line} progress={scrollYProgress} />
              ))}
            </ol>
            <Link href={cta.href} className="btn-primary pointer-events-auto px-7 py-3.5">
              {cta.label}
              <ArrowRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEP_RANGES: [number, number, number, number][] = [
  [-0.1, 0, 0.28, 0.36],
  [0.3, 0.38, 0.6, 0.68],
  [0.62, 0.7, 1, 1.1],
];

function StepLine({ index, line, progress }: { index: number; line: string; progress: MotionValue<number> }) {
  const range = STEP_RANGES[index] ?? [0, 0, 1, 1];
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, [16, 0, 0, -16]);
  return (
    <motion.li
      style={{ opacity, y }}
      className={`flex items-baseline gap-4 text-lg leading-snug text-mocha-700 sm:text-xl ${index > 0 ? "absolute inset-x-0 top-0" : ""}`}
    >
      <span className="font-heading text-sm text-gold-600">{String(index + 1).padStart(2, "0")}</span>
      <span className="font-heading">{line}</span>
    </motion.li>
  );
}

function ReportFailure({ onFail }: { onFail: () => void }) {
  const reported = useRef(false);
  if (!reported.current) {
    reported.current = true;
    queueMicrotask(onFail);
  }
  return null;
}

// Static stand-in (no WebGL / scene error): the photo in an arch frame that
// still responds gently to scroll.
function FallbackArt({ src, alt, progress }: { src: string; alt: string; progress: MotionValue<number> }) {
  const scale = useTransform(progress, [0, 1], [1.08, 1]);
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative h-[52svh] w-[min(74vw,25rem)] overflow-hidden rounded-t-full border border-gold-300/40 shadow-soft-lg">
        <motion.div style={{ scale }} className="absolute inset-0">
          <Image src={src} alt={alt} fill sizes="(max-width: 768px) 74vw, 25rem" className="object-cover" />
        </motion.div>
      </div>
    </div>
  );
}
