"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { DodanaImage } from "@/components/ui/dodana-image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  fallbackAlt,
  overlay,
}: {
  images: { url: string; alt: string }[];
  fallbackAlt: string;
  // Rendered over the main image (e.g. the "3D VIEW" button).
  overlay?: React.ReactNode;
}) {
  const t = useTranslations("product");
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide lg:max-h-[640px] lg:w-20 lg:flex-col lg:overflow-y-auto"
          role="group"
          aria-label={t("gallery")}
        >
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t("viewImage", { index: i + 1 })}
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
        className="relative aspect-[4/5] w-full flex-1 overflow-hidden rounded-card bg-sand-100"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={current?.url ?? "empty"}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DodanaImage
              src={current?.url}
              alt={current?.alt || fallbackAlt}
              fill
              showWordmark
              iconClassName="h-8 w-8"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="object-cover transition-transform duration-300 ease-out can-hover:cursor-zoom-in"
              style={zoom ? { transform: "scale(1.6)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </motion.div>
        </AnimatePresence>
        {overlay && <div className="absolute bottom-4 start-4 z-10">{overlay}</div>}
        {images.length > 1 && (
          <span className="absolute bottom-4 end-4 rounded-full bg-ivory/85 px-3 py-1 text-xs font-medium text-mocha-600 backdrop-blur">
            {active + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}
