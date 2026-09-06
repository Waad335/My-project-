"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { BowIcon } from "@/components/icons/decorative";

type DodanaImageProps = Omit<ImageProps, "src" | "onError" | "alt"> & {
  src: string | null | undefined;
  alt: string;
  showWordmark?: boolean;
  iconClassName?: string;
};

/**
 * Wraps next/image with a branded empty state: used whenever a product,
 * category, or Instagram-sourced image is missing or fails to load, so we
 * never show a broken-image icon or an empty white box.
 */
export function DodanaImage({ src, alt, className, showWordmark, iconClassName, ...props }: DodanaImageProps) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-blush-100 via-ivory-200 to-gold-100",
          className
        )}
      >
        <BowIcon className={cn("h-5 w-5 text-blush-300", iconClassName)} />
        {showWordmark && <span className="font-heading text-xs tracking-wide text-mocha-300">DODANA</span>}
      </div>
    );
  }

  return <Image src={src} alt={alt} className={className} onError={() => setBroken(true)} {...props} />;
}
