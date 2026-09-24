import Link from "next/link";
import { DodanaImage } from "@/components/ui/dodana-image";
import { cn } from "@/lib/utils";

// A product photo presented like a gallery piece: arch-topped, with an ivory
// passe-partout, a hairline gold edge and a soft floor shadow.
export function ArchFrame({
  src,
  alt,
  href,
  label,
  sizes,
  priority,
  className,
  tabIndex,
}: {
  src: string;
  alt: string;
  href?: string;
  label?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  tabIndex?: number;
}) {
  const frame = (
    <span className="relative block h-full w-full rounded-t-full rounded-b-[14px] bg-ivory-50 p-[5px] shadow-[0_30px_60px_-28px_rgba(58,38,32,0.45),0_8px_20px_-12px_rgba(58,38,32,0.25)] ring-1 ring-gold-400/40 sm:p-[7px]">
      <span className="relative block h-full w-full overflow-hidden rounded-t-full rounded-b-[10px] bg-sand-100">
        <DodanaImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.05]"
        />
        {/* soft top light so every photo sits in the same "room" */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-mocha-900/10" />
      </span>
    </span>
  );

  if (!href) return <span className={cn("block", className)}>{frame}</span>;

  return (
    <Link href={href} tabIndex={tabIndex} aria-label={label ?? alt} className={cn("group block focus-visible:outline-offset-4", className)}>
      {frame}
      {label && (
        <span className="pointer-events-none absolute -bottom-9 left-1/2 w-max max-w-[16rem] -translate-x-1/2 truncate rounded-full bg-ivory/90 px-3 py-1 text-[11px] font-medium text-mocha-700 opacity-0 shadow-soft backdrop-blur transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
          {label}
        </span>
      )}
    </Link>
  );
}
