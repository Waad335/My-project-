import Image from "next/image";
import { PlaceholderArt } from "./PlaceholderArt";
import { ProductMockup } from "./ProductMockup";
import { cn } from "@/lib/utils";
import type { MockupCategory } from "@/lib/mockup-category";

interface ProductMediaProps {
  src?: string | null;
  alt: string;
  seed: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  category?: MockupCategory;
}

/** Renders a real Shopify CDN image when available, else a branded mockup/placeholder panel. */
export function ProductMedia({ src, alt, seed, className, sizes, priority, category }: ProductMediaProps) {
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
      {category ? (
        <ProductMockup seed={seed} title={alt} category={category} className="absolute inset-0" />
      ) : (
        <PlaceholderArt seed={seed} label={alt} className="absolute inset-0" />
      )}
    </div>
  );
}
