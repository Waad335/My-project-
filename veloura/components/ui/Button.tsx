import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode, MouseEventHandler } from "react";

type Variant = "primary" | "secondary" | "ghost" | "light" | "outlineLight";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans tracking-[0.08em] uppercase transition-colors duration-300 ease-[var(--ease-luxury)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-gold)] disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-black text-ivory hover:bg-brown",
  secondary: "border border-black/70 text-black hover:border-black hover:bg-black hover:text-ivory",
  ghost: "text-black hover:text-gold",
  // For use on dark/photographic backgrounds (e.g. the hero) — ivory fill, flips to gold on hover.
  light: "bg-ivory text-black hover:bg-gold",
  // Outline variant for use on dark backgrounds — ivory border/text, fills ivory on hover.
  outlineLight: "border border-ivory/40 text-ivory hover:border-ivory hover:bg-ivory hover:text-black",
};

const sizes: Record<Size, string> = {
  sm: "text-[11px] px-5 py-2.5",
  md: "text-xs px-7 py-3.5",
  lg: "text-xs px-9 py-4.5",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}

interface ButtonAsButton extends CommonProps {
  href?: undefined;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

interface ButtonAsLink extends CommonProps {
  href: string;
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className, children, ariaLabel } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href) {
    return (
      <Link
        href={props.href}
        target={props.target}
        rel={props.rel}
        onClick={props.onClick}
        className={classes}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }

  const linkless = props as ButtonAsButton;
  return (
    <button
      type={linkless.type ?? "button"}
      disabled={linkless.disabled}
      onClick={linkless.onClick}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
