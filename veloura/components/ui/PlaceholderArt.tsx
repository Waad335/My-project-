import { cn } from "@/lib/utils";

const PALETTES = [
  ["#3a2c1e", "#b08d4f"],
  ["#4a3b2c", "#d9c9b4"],
  ["#23201c", "#cba86a"],
  ["#5b4632", "#ede4d6"],
  ["#14120f", "#b08d4f"],
];

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface PlaceholderArtProps {
  seed: string;
  label?: string;
  className?: string;
  angle?: number;
}

/**
 * Original, deterministic editorial-art placeholder — a soft gradient panel with a
 * grain texture and an oversized initial. Used wherever no real product/collection
 * photography has been supplied yet (see README "Adding real imagery").
 */
export function PlaceholderArt({ seed, label, className, angle }: PlaceholderArtProps) {
  const hash = hashSeed(seed);
  const [from, to] = PALETTES[hash % PALETTES.length];
  const rotation = angle ?? (hash % 40) - 20;
  const initial = (label ?? seed).trim().charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "grain-overlay relative flex h-full w-full items-center justify-center overflow-hidden",
        className
      )}
      style={{
        background: `linear-gradient(${135 + (hash % 90)}deg, ${from}, ${to})`,
      }}
      role="img"
      aria-label={label ?? "VELOURA editorial placeholder artwork"}
    >
      <span
        className="font-serif-display select-none text-[38%] font-medium leading-none text-white/15"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {initial}
      </span>
      <span className="absolute bottom-4 left-4 right-4 text-[10px] uppercase tracking-[0.3em] text-white/50 sm:bottom-6 sm:left-6">
        VELOURA
      </span>
    </div>
  );
}
