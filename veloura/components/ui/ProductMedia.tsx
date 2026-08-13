import Image from "next/image";
import { PlaceholderArt } from "./PlaceholderArt";
import { cn } from "@/lib/utils";

interface ProductMediaProps {
  src?: string | null;
  alt: string;
  seed: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/** Renders a real Shopify CDN image when available, else a branded placeholder panel. */
export function ProductMedia({ src, alt, seed, className, sizes, priority }: ProductMediaProps) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? "(min-width: 1024px) 33vw, 100vw"}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <PlaceholderArt seed={seed} label={alt} className="absolute inset-0" />
    </div>
  );
}
