"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import { DodanaImage } from "@/components/ui/dodana-image";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const EASE = [0.22, 1, 0.36, 1] as const;

type Img = { url: string; alt: string };

// Full-screen product image viewer: zoom (buttons, wheel, double-click/tap,
// pinch), drag to pan while zoomed, swipe / arrows / keys between angles.
export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: Img[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("viewer");
  const [mounted, setMounted] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ startDist: number; startScale: number; startX: number; startY: number; px: number; py: number; moved: boolean } | null>(null);
  const lastTap = useRef(0);
  const count = images.length;
  const current = images[index];

  useEffect(() => setMounted(true), []);

  const clampPan = useCallback(
    (nx: number, ny: number, s: number) => {
      const rect = stage.current?.getBoundingClientRect();
      if (!rect) return { x: nx, y: ny };
      const maxX = ((s - 1) * rect.width) / 2;
      const maxY = ((s - 1) * rect.height) / 2;
      return { x: Math.max(-maxX, Math.min(maxX, nx)), y: Math.max(-maxY, Math.min(maxY, ny)) };
    },
    []
  );

  // Zoom to `next`, keeping the point under (cx, cy) — offsets from the stage
  // centre — where it is.
  const zoomTo = useCallback(
    (next: number, cx = 0, cy = 0, instant = false) => {
      const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
      const prev = scale.get();
      const ratio = s / prev;
      const target = clampPan(cx - (cx - x.get()) * ratio, cy - (cy - y.get()) * ratio, s);
      const opts = { duration: instant ? 0 : 0.35, ease: EASE };
      animate(scale, s, opts);
      animate(x, s === 1 ? 0 : target.x, opts);
      animate(y, s === 1 ? 0 : target.y, opts);
      setZoomed(s > 1.01);
    },
    [scale, x, y, clampPan]
  );

  const reset = useCallback(() => zoomTo(1), [zoomTo]);
  const go = useCallback(
    (dir: 1 | -1) => {
      if (count < 2) return;
      scale.set(1);
      x.set(0);
      y.set(0);
      setZoomed(false);
      onIndexChange((index + dir + count) % count);
    },
    [count, index, onIndexChange, scale, x, y]
  );

  // Keyboard, scroll lock, focus trap.
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const rtl = document.documentElement.dir === "rtl";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(rtl ? -1 : 1);
      else if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
      else if (e.key === "+" || e.key === "=") zoomTo(scale.get() * 1.5);
      else if (e.key === "-") zoomTo(scale.get() / 1.5);
      else if (e.key === "0") reset();
      else if (e.key === "Tab" && dialog.current) {
        const focusable = dialog.current.querySelectorAll<HTMLElement>("button:not([disabled])");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [go, onClose, reset, zoomTo, scale]);

  // Wheel zoom around the cursor (non-passive so the page doesn't scroll).
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * 0.0022);
      zoomTo(scale.get() * factor, e.clientX - rect.left - rect.width / 2, e.clientY - rect.top - rect.height / 2, true);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomTo, scale, mounted]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(pointers.current.values());
    const dist = pts.length === 2 ? Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y) : 0;
    gesture.current = { startDist: dist, startScale: scale.get(), startX: x.get(), startY: y.get(), px: e.clientX, py: e.clientY, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const pts = Array.from(pointers.current.values());
    if (pts.length === 2 && g.startDist > 0) {
      const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, (g.startScale * dist) / g.startDist));
      scale.set(s);
      const clamped = clampPan(x.get(), y.get(), s);
      x.set(clamped.x);
      y.set(clamped.y);
      g.moved = true;
      return;
    }
    const dx = e.clientX - g.px;
    const dy = e.clientY - g.py;
    if (Math.abs(dx) + Math.abs(dy) > 4) g.moved = true;
    if (scale.get() > 1.01) {
      const clamped = clampPan(g.startX + dx, g.startY + dy, scale.get());
      x.set(clamped.x);
      y.set(clamped.y);
    } else {
      x.set(dx * 0.6); // swipe preview
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (!g || pointers.current.size > 0) return;
    gesture.current = null;
    const s = scale.get();
    setZoomed(s > 1.01);
    if (s <= 1.01) {
      const dx = e.clientX - g.px;
      const rtl = document.documentElement.dir === "rtl";
      if (g.moved && Math.abs(dx) > 70 && count > 1) {
        go((dx < 0) !== rtl ? 1 : -1);
        return;
      }
      animate(x, 0, { duration: 0.3, ease: EASE });
      animate(y, 0, { duration: 0.3, ease: EASE });
      if (s !== 1) animate(scale, 1, { duration: 0.3, ease: EASE });
    }
    // Double tap / double click toggles zoom at that point.
    if (!g.moved) {
      const now = performance.now();
      if (now - lastTap.current < 300) {
        const rect = stage.current!.getBoundingClientRect();
        if (s > 1.01) reset();
        else zoomTo(2.5, e.clientX - rect.left - rect.width / 2, e.clientY - rect.top - rect.height / 2);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  }

  if (!mounted || !current) return null;

  return createPortal(
    <motion.div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={t("imageViewer")}
      className="fixed inset-0 z-[60] flex flex-col bg-ivory/[0.98] backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-sm tabular-nums text-mocha-500" aria-live="polite">
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-2">
          <ToolButton label={t("zoomOut")} onClick={() => zoomTo(scale.get() / 1.5)}>
            <Minus size={16} />
          </ToolButton>
          <ToolButton label={t("zoomIn")} onClick={() => zoomTo(scale.get() * 1.5)}>
            <Plus size={16} />
          </ToolButton>
          <ToolButton label={t("reset")} onClick={reset} disabled={!zoomed}>
            <RotateCcw size={16} />
          </ToolButton>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label={t("closeViewer")}
            className="ms-2 flex h-11 w-11 items-center justify-center rounded-full bg-mocha-700 text-ivory hover:bg-mocha-800"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        ref={stage}
        className={cn("relative mx-auto w-full flex-1 touch-none select-none overflow-hidden", zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={current.url + index}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <motion.div style={{ scale, x, y }} className="relative h-full w-full will-change-transform">
              <DodanaImage src={current.url} alt={current.alt} fill sizes="100vw" className="object-contain" draggable={false} />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {count > 1 && !zoomed && (
          <>
            <NavButton side="start" label={t("previousImage")} onClick={() => go(-1)} />
            <NavButton side="end" label={t("nextImage")} onClick={() => go(1)} />
          </>
        )}
      </div>

      <p className="px-4 pt-2 text-center text-xs text-mocha-400">{t("zoomHint")}</p>
      {count > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-4 pt-3 scrollbar-hide" role="group" aria-label={t("photoAngles")}>
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => {
                reset();
                onIndexChange(i);
              }}
              aria-label={t("viewAngle", { index: i + 1 })}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-xl border transition-all",
                i === index ? "border-mocha-700" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <DodanaImage src={img.url} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>,
    document.body
  );
}

function ToolButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-mocha-700/15 text-mocha-700 transition-colors hover:border-mocha-700 disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function NavButton({ side, label, onClick }: { side: "start" | "end"; label: string; onClick: () => void }) {
  const Icon = side === "start" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-mocha-700 shadow-soft transition hover:bg-white sm:flex",
        side === "start" ? "start-4" : "end-4"
      )}
    >
      <Icon size={20} className="rtl:-scale-x-100" />
    </button>
  );
}
