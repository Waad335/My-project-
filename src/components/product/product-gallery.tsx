"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { DodanaImage } from "@/components/ui/dodana-image";
import { ImageLightbox } from "@/components/product/image-lightbox";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

// Product photos, presented with care: soft pointer parallax, swipe and
// arrows between angles with directional transitions, and a full-screen
// zoomable viewer. Real photos only — nothing rendered or invented.
export function ProductGallery({
  images,
  fallbackAlt,
  overlay,
}: {
  images: { url: string; alt: string }[];
  fallbackAlt: string;
  // Rendered over the main image (the "3D View" button, when a real model exists).
  overlay?: React.ReactNode;
}) {
  const t = useTranslations("viewer");
  const tp = useTranslations("product");
  const reduced = useReducedMotion();
  const [[active, direction], setActive] = useState<[number, number]>([0, 0]);
  const [viewerOpen, setViewerOpen] = useState(false);
  // Where keyboard focus returns when the viewer closes: the visible "open
  // full screen" button (also used when the photo itself was clicked), or the
  // gallery region when it was opened with Enter on the region.
  const openButton = useRef<HTMLButtonElement>(null);
  const region = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  function openViewer(from: HTMLElement | null) {
    returnFocus.current = from;
    setViewerOpen(true);
  }
  const count = images.length;
  const current = images[active] ?? images[0];

  // Pointer parallax on the main image (hover devices only, via CSS gating
  // of the transform origin — touch devices simply never move the pointer).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 120, damping: 20 });
  const sy = useSpring(py, { stiffness: 120, damping: 20 });
  const tx = useTransform(sx, (v) => v * -14);
  const ty = useTransform(sy, (v) => v * -14);

  function go(dir: 1 | -1) {
    if (count < 2) return;
    setActive(([i]) => [(i + dir + count) % count, dir]);
  }
  function select(i: number) {
    setActive(([prev]) => [i, i > prev ? 1 : -1]);
  }

  const rtl = useLocale() === "ar";
  // A swipe ends with a click on the image; don't let it open the viewer.
  const dragged = useRef(false);

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide lg:max-h-[680px] lg:w-20 lg:flex-col lg:overflow-y-auto" role="group" aria-label={tp("gallery")}>
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => select(i)}
              aria-label={t("viewAngle", { index: i + 1 })}
              aria-current={i === active ? "true" : undefined}
              className={cn(
                "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl border transition-all duration-300 lg:w-full",
                i === active ? "border-mocha-700" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <DodanaImage src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div
        className="group relative aspect-[4/5] w-full flex-1 overflow-hidden rounded-card bg-sand-100"
        role="region"
        aria-roledescription="carousel"
        aria-label={tp("gallery")}
        tabIndex={0}
        ref={region}
        onKeyDown={(e) => {
          // Only when the region itself has focus — keys pressed on the arrow
          // or full-screen buttons inside it bubble up here too.
          if (e.target !== e.currentTarget) return;
          if (e.key === "ArrowRight") go(rtl ? -1 : 1);
          if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
          if (e.key === "Enter") openViewer(region.current);
        }}
        onPointerMove={(e) => {
          if (reduced || e.pointerType !== "mouse") return;
          const rect = e.currentTarget.getBoundingClientRect();
          px.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
          py.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
        }}
        onPointerLeave={() => {
          px.set(0);
          py.set(0);
        }}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current?.url ?? "empty"}
            custom={direction}
            className="absolute inset-0"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: `${direction * (rtl ? -8 : 8)}%` }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: `${direction * (rtl ? 8 : -8)}%` }}
            transition={{ duration: 0.6, ease: EASE }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragStart={() => {
              dragged.current = true;
            }}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) < 60) return;
              const forward = info.offset.x < 0 !== rtl;
              go(forward ? 1 : -1);
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (dragged.current) {
                  dragged.current = false;
                  return;
                }
                openViewer(openButton.current);
              }}
              className="absolute inset-0 cursor-zoom-in"
              aria-label={t("openViewer")}
              tabIndex={-1}
            >
              <motion.div style={{ x: tx, y: ty }} className="absolute -inset-4">
                <DodanaImage
                  src={current?.url}
                  alt={current?.alt || fallbackAlt}
                  fill
                  showWordmark
                  iconClassName="h-8 w-8"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={active === 0}
                  draggable={false}
                  className="object-cover"
                />
              </motion.div>
            </button>
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <ArrowButton side="start" label={t("previousImage")} onClick={() => go(-1)} />
            <ArrowButton side="end" label={t("nextImage")} onClick={() => go(1)} />
          </>
        )}

        <div className="absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-3">
          <div>{overlay}</div>
          <div className="flex items-center gap-2">
            {count > 1 && (
              <span className="rounded-full bg-ivory/85 px-3 py-1 text-xs font-medium tabular-nums text-mocha-600 backdrop-blur">
                {active + 1} / {count}
              </span>
            )}
            <button
              ref={openButton}
              type="button"
              onClick={() => openViewer(openButton.current)}
              aria-label={t("openViewer")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory/90 text-mocha-700 shadow-soft backdrop-blur transition hover:bg-white"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {viewerOpen && (
          <ImageLightbox
            images={images.length ? images : [{ url: "", alt: fallbackAlt }]}
            index={active}
            onIndexChange={select}
            onClose={() => setViewerOpen(false)}
            returnFocusTo={returnFocus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ArrowButton({ side, label, onClick }: { side: "start" | "end"; label: string; onClick: () => void }) {
  const Icon = side === "start" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/85 text-mocha-700 shadow-soft backdrop-blur transition-all duration-300 hover:bg-white can-hover:opacity-0 can-hover:group-hover:opacity-100 focus-visible:opacity-100",
        side === "start" ? "start-3" : "end-3"
      )}
    >
      <Icon size={18} className="rtl:-scale-x-100" />
    </button>
  );
}
