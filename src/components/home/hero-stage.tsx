"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { ShowcaseItem } from "@/lib/queries";
import { CanvasErrorBoundary } from "@/components/3d/CanvasErrorBoundary";
import { StaticStage } from "@/components/boutique/static-stage";
import { use3DCapability } from "@/hooks/use-3d-capability";
import { useIdleMount } from "@/hooks/use-idle-mount";

// three.js + the scene live in their own chunk, fetched only on desktop-class
// devices once the page is idle. Everyone else gets the 2.5D stage.
const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), { ssr: false });

type HeroStageProps = {
  children: React.ReactNode;
  items: ShowcaseItem[];
  locale: string;
  loadingLabel: string;
};

export function HeroStage({ children, items, locale, loadingLabel }: HeroStageProps) {
  const section = useRef<HTMLElement>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const { webgl, quality, layout } = use3DCapability({ wideOnly: true });
  // WebGL only where it's worth it: wide layout on a capable GPU/CPU. Phones,
  // tablets and low-power laptops keep the (lighter) 2.5D stage.
  const wants3D = webgl === true && layout === "wide" && quality === "high" && items.length > 0;
  const idle = useIdleMount(wants3D);
  const inView = useInView(section, { margin: "0px 0px -15% 0px" });
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [percent, setPercent] = useState(0);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reducedMotion ? 0 : -50]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, reducedMotion ? 1 : 0]);

  const markReady = useCallback(() => setSceneReady(true), []);
  const showScene = wants3D && idle && !sceneFailed;
  const sceneVisible = showScene && sceneReady;
  const loading = showScene && !sceneReady;

  // Leaving the wide layout unmounts the canvas: fall back to the 2.5D stage.
  useEffect(() => {
    if (!showScene) setSceneReady(false);
  }, [showScene]);

  return (
    <section
      ref={section}
      aria-labelledby="hero-title"
      className="studio-backdrop relative isolate overflow-hidden lg:min-h-[max(640px,calc(100svh-6rem))]"
    >
      <div className="container-dodana grid items-center gap-6 pb-10 pt-10 sm:pt-14 lg:min-h-[inherit] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 lg:py-12">
        <motion.div style={{ y: copyY, opacity: copyOpacity }} className="relative z-10">
          {children}
        </motion.div>

        {/* The stage has its own column (its own block on small screens), so
            the scene can never sit on top of the copy or the CTAs. */}
        <div className="relative h-[min(56svh,450px)] min-h-[330px] w-full sm:h-[min(64svh,560px)] lg:h-[min(76svh,720px)] lg:min-h-[520px]">
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ease-luxe ${sceneVisible ? "opacity-0" : "opacity-100"}`}
            aria-hidden={sceneVisible || undefined}
          >
            <StaticStage items={items} locale={locale} motionEnabled={!reducedMotion} interactive={!sceneVisible} />
          </div>

          {showScene && (
            <div
              aria-hidden="true"
              className={`absolute inset-0 transition-opacity duration-1000 ease-luxe ${sceneVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <CanvasErrorBoundary fallback={<FailedScene onFail={() => setSceneFailed(true)} />}>
                <HeroScene
                  items={items}
                  locale={locale}
                  reducedMotion={reducedMotion}
                  active={inView}
                  progress={scrollYProgress}
                  mirror={locale === "ar"}
                  onReady={markReady}
                  onProgress={setPercent}
                />
              </CanvasErrorBoundary>
            </div>
          )}

          <AnimatePresence>{loading && <SceneLoader label={loadingLabel} percent={percent} />}</AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// Quiet loading state while the 3D stage prepares, shown over the (already
// complete) 2.5D stage: a hairline gold track that fills with real progress.
function SceneLoader({ label, percent }: { label: string; percent: number }) {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-mocha-600 rtl:normal-case rtl:tracking-normal">
        {label}
      </span>
      <span className="relative h-px w-28 overflow-hidden bg-gold-400/25">
        {percent > 0 ? (
          <span
            className="absolute inset-y-0 start-0 bg-gold-500 transition-[width] duration-500 ease-luxe"
            style={{ width: `${Math.max(8, percent)}%` }}
          />
        ) : (
          <span className="absolute inset-y-0 w-1/3 animate-loader-sweep bg-gold-500" />
        )}
      </span>
    </motion.div>
  );
}

// Rendered by the error boundary: reports the failure up so the 2.5D stage
// stays, instead of an empty canvas.
function FailedScene({ onFail }: { onFail: () => void }) {
  const reported = useRef(false);
  if (!reported.current) {
    reported.current = true;
    queueMicrotask(onFail);
  }
  return null;
}
