"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CanvasErrorBoundary } from "@/components/3d/CanvasErrorBoundary";
import type { HeroCategoryHrefs } from "@/components/3d/HeroScene";
import { use3DCapability } from "@/hooks/use-3d-capability";
import { useIdleMount } from "@/hooks/use-idle-mount";

// three.js + the scene are split into their own chunk and only fetched on
// the client once the page is idle — the server-rendered photo is the LCP.
const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), { ssr: false });

type HeroStageProps = {
  children: React.ReactNode;
  categoryHrefs: HeroCategoryHrefs;
  mirror: boolean;
  fallbackAlt: string;
  scrollLabel: string;
};

export function HeroStage({ children, categoryHrefs, mirror, fallbackAlt, scrollLabel }: HeroStageProps) {
  const section = useRef<HTMLElement>(null!);
  const reducedMotion = Boolean(useReducedMotion());
  const { webgl, quality, layout } = use3DCapability();
  const idle = useIdleMount(webgl === true);
  const inView = useInView(section, { margin: "0px 0px -15% 0px" });
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reducedMotion ? 0 : -60]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reducedMotion ? 1 : 0]);

  const markReady = useCallback(() => setSceneReady(true), []);
  const showScene = webgl === true && idle && !sceneFailed;
  const fallbackVisible = !sceneReady || sceneFailed;

  return (
    <section
      ref={section}
      aria-labelledby="hero-title"
      className="studio-backdrop relative isolate flex w-full flex-col overflow-hidden lg:min-h-[max(640px,calc(100svh-6rem))] lg:flex-row lg:items-center"
    >
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="container-dodana relative z-10 pb-0 pt-8 sm:pt-14 lg:pb-24 lg:pt-12"
      >
        {children}
      </motion.div>

      {/* The stage: full-bleed behind the copy on desktop, its own block
          below the copy on tablets and phones. */}
      <div className="relative h-[min(52svh,520px)] min-h-[320px] sm:h-[min(58svh,560px)] w-full lg:absolute lg:inset-0 lg:-z-10 lg:h-auto lg:min-h-0">
        {/* Static art direction: the first paint, the no-WebGL experience
            and the fallback if the 3D scene errors. Fades out once 3D is live. */}
        <div
          aria-hidden={!fallbackVisible}
          className={`absolute inset-0 transition-opacity duration-1000 ease-luxe ${
            fallbackVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src="/hero/hero-visual.png"
            alt={fallbackAlt}
            fill
            priority
            sizes="100vw"
            className={`object-cover object-right-bottom ${mirror ? "-scale-x-100" : ""}`}
          />
          <div
            className={`absolute inset-0 hidden lg:block ${
              mirror ? "bg-gradient-to-l" : "bg-gradient-to-r"
            } from-ivory/90 via-ivory/45 to-transparent`}
          />
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-ivory to-transparent lg:hidden" />
        </div>

        {showScene && (
          <div
            aria-hidden="true"
            className={`absolute inset-0 transition-opacity duration-1000 ease-luxe ${
              sceneReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <CanvasErrorBoundary fallback={<FailedScene onFail={setSceneFailed} />}>
              <HeroScene
                quality={quality}
                layout={layout}
                reducedMotion={reducedMotion}
                active={inView}
                progress={scrollYProgress}
                eventSource={section}
                categoryHrefs={categoryHrefs}
                mirror={mirror}
                onReady={markReady}
              />
            </CanvasErrorBoundary>
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-6 hidden flex-col items-center gap-2 text-mocha-600 lg:flex"
        aria-hidden="true"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] rtl:normal-case rtl:tracking-normal">
          {scrollLabel}
        </span>
        <span className="relative h-10 w-px overflow-hidden bg-mocha-700/15">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-scroll-cue bg-mocha-700/70" />
        </span>
      </div>
    </section>
  );
}

// Rendered by the error boundary: reports the failure up so the static art
// stays visible instead of an empty canvas.
function FailedScene({ onFail }: { onFail: (failed: boolean) => void }) {
  const reported = useRef(false);
  if (!reported.current) {
    reported.current = true;
    queueMicrotask(() => onFail(true));
  }
  return null;
}
