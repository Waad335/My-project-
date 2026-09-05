"use client";

import { useState } from "react";
import { DodanaImage } from "@/components/ui/dodana-image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  fallbackAlt,
}: {
  images: { url: string; alt: string }[];
  fallbackAlt: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-ivory-200">
        <DodanaImage
          src={current?.url}
          alt={current?.alt || fallbackAlt}
          fill
          showWordmark
          iconClassName="h-8 w-8"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition",
                i === active ? "border-blush-400" : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`View image ${i + 1}`}
            >
              <DodanaImage src={img.url} alt={img.alt || fallbackAlt} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
