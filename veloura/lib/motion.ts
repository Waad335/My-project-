/**
 * Shared Framer Motion timing tokens — the JS-side counterpart to the
 * --duration-fast/base/slow and --ease-luxury CSS custom properties in
 * app/globals.css. Tailwind utility classes read the CSS tokens directly;
 * anything driven by Framer Motion's `transition` prop (which takes plain
 * numbers/arrays, not CSS) imports these instead of repeating literals.
 */

/** Matches --ease-luxury: cubic-bezier(0.22, 1, 0.36, 1) */
export const EASE_LUXURY = [0.22, 1, 0.36, 1] as const;

/** Seconds, matching --duration-fast/base/slow in app/globals.css */
export const DURATION = {
  fast: 0.24,
  base: 0.65,
  slow: 0.9,
} as const;
