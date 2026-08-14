"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });
const WorkspaceScene = dynamic(() => import("./WorkspaceScene"), { ssr: false });

type Variant = "hero" | "workspace";

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [query]);
  return matches;
}

/**
 * Lazy-loaded, reduced-motion- and low-power-aware 3D section.
 * The Three.js/R3F bundle is only fetched once this section scrolls near the
 * viewport, and never on devices/preferences where it shouldn't run.
 */
export function Scene3D({ variant, className }: { variant: Variant; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useRef(0);
  const inView = useInView(containerRef);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const canRender3D = inView && !prefersReducedMotion;

  useEffect(() => {
    if (!canRender3D) return;
    let raf = 0;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = rect.height + window.innerHeight;
        const progressed = window.innerHeight - rect.top;
        scrollProgress.current = Math.min(1, Math.max(0, progressed / total));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [canRender3D]);

  return (
    <div ref={containerRef} className={cn("overflow-hidden", className)}>
      {canRender3D && !isMobile && variant === "hero" && <HeroScene scrollProgress={scrollProgress} />}
      {canRender3D && !isMobile && variant === "workspace" && (
        <WorkspaceScene scrollProgress={scrollProgress} />
      )}
      {(!canRender3D || isMobile) && <Scene3DFallback variant={variant} />}
    </div>
  );
}

function Scene3DFallback({ variant }: { variant: Variant }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        variant === "hero"
          ? "bg-[radial-gradient(circle_at_50%_40%,rgba(176,141,79,0.28),transparent_60%)]"
          : "bg-[radial-gradient(circle_at_50%_50%,rgba(176,141,79,0.18),transparent_65%)]"
      )}
      aria-hidden="true"
    >
      <div className="relative h-2/3 w-2/3 max-w-md">
        <div className="absolute left-[10%] top-[8%] h-[55%] w-[45%] rotate-[-8deg] rounded-sm bg-gradient-to-br from-[#f7f2e9] to-[#d9c9b4] shadow-2xl motion-safe:animate-[float_7s_ease-in-out_infinite]" />
        <div className="absolute right-[8%] top-[20%] h-[48%] w-[40%] rotate-[6deg] rounded-sm bg-gradient-to-br from-[#efe6d6] to-[#b08d4f]/70 shadow-2xl motion-safe:animate-[float_8s_ease-in-out_infinite_1s]" />
      </div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-14px) rotate(var(--r, 0deg)); }
        }
      `}</style>
    </div>
  );
}
