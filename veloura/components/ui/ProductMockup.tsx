import type { ComponentType } from "react";
import { cn, hashSeed } from "@/lib/utils";
import { MOCKUP_PALETTES } from "./PlaceholderArt";
import type { MockupCategory } from "@/lib/mockup-category";
import { MockupTilt } from "./mockups/MockupTilt";
import { ResumeMockup } from "./mockups/ResumeMockup";
import { BrandKitMockup } from "./mockups/BrandKitMockup";
import { PlannerMockup } from "./mockups/PlannerMockup";
import { SocialMockup } from "./mockups/SocialMockup";
import { BusinessMockup } from "./mockups/BusinessMockup";

const RENDERERS: Record<MockupCategory, ComponentType<{ hash: number; title: string }>> = {
  resume: ResumeMockup,
  brand: BrandKitMockup,
  planner: PlannerMockup,
  social: SocialMockup,
  business: BusinessMockup,
};

interface ProductMockupProps {
  seed: string;
  title: string;
  category: MockupCategory;
  className?: string;
}

/**
 * Premium, category-aware product visual shown whenever a product has no real
 * photography — a layered, tilt-interactive mockup that communicates what the
 * product actually is (resume sheets, brand cards, a planner, social posts, a
 * business folder) instead of a flat branded rectangle. Deterministic per
 * `seed` so the same product always renders the same variant, and every
 * product gets a visually distinct layout/rotation/palette from its peers.
 */
export function ProductMockup({ seed, title, category, className }: ProductMockupProps) {
  const hash = hashSeed(seed);
  const [from, to] = MOCKUP_PALETTES[hash % MOCKUP_PALETTES.length];
  const Renderer = RENDERERS[category];

  return (
    <div
      className={cn(
        "grain-overlay relative flex h-full w-full items-center justify-center overflow-hidden",
        className
      )}
      style={{ background: `linear-gradient(${135 + (hash % 90)}deg, ${from}, ${to})` }}
      role="img"
      aria-label={title}
    >
      <MockupTilt>
        <Renderer hash={hash} title={title} />
      </MockupTilt>
      <span className="pointer-events-none absolute right-4 top-4 text-[10px] uppercase tracking-[0.3em] text-white/50 sm:right-6 sm:top-6">
        VELOURA
      </span>
    </div>
  );
}
