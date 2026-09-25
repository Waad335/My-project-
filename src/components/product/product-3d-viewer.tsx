"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Box, Minus, Plus, RotateCcw, Pause, Play, X } from "lucide-react";
import { CanvasErrorBoundary } from "@/components/3d/CanvasErrorBoundary";
import type { ViewerAction, ViewerCommand } from "@/components/3d/ProductViewerScene";
import { use3DCapability } from "@/hooks/use-3d-capability";
import { cn } from "@/lib/utils";

const ProductViewerScene = dynamic(() => import("@/components/3d/ProductViewerScene"), {
  ssr: false,
  loading: () => <ViewerSpinner />,
});

const EASE = [0.22, 1, 0.36, 1] as const;

// "3D VIEW" trigger + full-screen modal with an interactive, illustrative
// model: drag to rotate, scroll/pinch to zoom, preset angles.
export function Product3DViewer({ modelUrl, productName }: { modelUrl: string; productName: string }) {
  const t = useTranslations("viewer");
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(!reducedMotion);
  const [command, setCommand] = useState<ViewerCommand>(null);
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { webgl, quality } = use3DCapability();
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const send = (action: ViewerAction) => setCommand((c) => ({ id: (c?.id ?? 0) + 1, action }));

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const triggerEl = trigger.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && dialog.current) {
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
      triggerEl?.focus();
    };
  }, [open]);

  const angles: { action: ViewerAction; label: string }[] = [
    { action: "front", label: t("front") },
    { action: "side", label: t("side") },
    { action: "back", label: t("back") },
    { action: "top", label: t("top") },
  ];

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-mocha-700/15 bg-ivory/90 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-mocha-700 shadow-soft backdrop-blur transition-all duration-300 hover:border-mocha-700 hover:bg-mocha-700 hover:text-ivory rtl:text-xs rtl:normal-case rtl:tracking-normal"
      >
        <Box size={15} aria-hidden="true" />
        {t("open")}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="viewer-title">
                <motion.div
                  className="absolute inset-0 bg-mocha-900/45 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  ref={dialog}
                  className="absolute inset-2 flex flex-col overflow-hidden rounded-[1.75rem] bg-ivory shadow-soft-lg sm:inset-6 lg:inset-x-[8vw] lg:inset-y-8"
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
                    <div>
                      <p className="eyebrow">{t("eyebrow")}</p>
                      <h2 id="viewer-title" className="mt-2 font-heading text-xl text-mocha-700 sm:text-2xl">
                        {productName}
                      </h2>
                    </div>
                    <button
                      ref={closeButton}
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label={t("close")}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-mocha-700/15 hover:bg-mocha-700/5"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="studio-backdrop relative m-3 flex-1 overflow-hidden rounded-[1.25rem] sm:mx-8 sm:my-5">
                    {webgl === false || failed ? (
                      <div className="flex h-full items-center justify-center px-8 text-center text-sm text-mocha-500">
                        {t("unsupported")}
                      </div>
                    ) : webgl === true ? (
                      <CanvasErrorBoundary fallback={<FailureReporter onFail={() => setFailed(true)} />}>
                        <div
                          className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
                          aria-label={t("canvasLabel")}
                          role="img"
                        >
                          <ProductViewerScene modelUrl={modelUrl} loadingLabel={t("loadingModel")} quality={quality} autoRotate={autoRotate} command={command} />
                        </div>
                      </CanvasErrorBoundary>
                    ) : (
                      <ViewerSpinner />
                    )}
                    <p className="pointer-events-none absolute inset-x-0 bottom-4 px-4 text-center text-xs text-mocha-500">
                      {t("hint")}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:pb-7">
                    <div className="flex flex-wrap gap-2" role="group" aria-label={t("angles")}>
                      {angles.map((a) => (
                        <button
                          key={a.action}
                          type="button"
                          onClick={() => {
                            setAutoRotate(false);
                            send(a.action);
                          }}
                          className="rounded-full border border-mocha-700/15 px-4 py-2 text-sm font-medium text-mocha-600 transition-colors hover:border-mocha-700 hover:text-mocha-800"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <IconButton label={t("zoomOut")} onClick={() => send("zoom-out")}>
                        <Minus size={16} />
                      </IconButton>
                      <IconButton label={t("zoomIn")} onClick={() => send("zoom-in")}>
                        <Plus size={16} />
                      </IconButton>
                      <IconButton
                        label={autoRotate ? t("pause") : t("play")}
                        onClick={() => setAutoRotate((v) => !v)}
                        pressed={autoRotate}
                      >
                        {autoRotate ? <Pause size={16} /> : <Play size={16} />}
                      </IconButton>
                      <IconButton
                        label={t("reset")}
                        onClick={() => {
                          setAutoRotate(!reducedMotion);
                          send("reset");
                        }}
                      >
                        <RotateCcw size={16} />
                      </IconButton>
                    </div>
                  </div>
                  <p className="border-t border-mocha-700/8 px-5 py-3 text-center text-xs text-mocha-500 sm:px-8">
                    {t("disclaimer")}
                  </p>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

function IconButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border transition-colors hover:border-mocha-700",
        pressed ? "border-mocha-700 bg-mocha-700 text-ivory" : "border-mocha-700/15 text-mocha-700"
      )}
    >
      {children}
    </button>
  );
}

function ViewerSpinner() {
  return (
    <div className="flex h-full items-center justify-center" aria-busy="true">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-mocha-700/15 border-t-mocha-700" />
    </div>
  );
}

function FailureReporter({ onFail }: { onFail: () => void }) {
  const reported = useRef(false);
  if (!reported.current) {
    reported.current = true;
    queueMicrotask(onFail);
  }
  return null;
}
