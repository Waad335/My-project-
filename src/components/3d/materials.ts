// Shared 3D presets. The storefront renders real product photos and real
// .glb models only — these colours are for the stage (plinth, gold accents,
// passe-partout), never for products.
export type SceneQuality = "high" | "low";

export const PALETTE = {
  gold: "#d6b27c",
  pearl: "#fbf1ea",
  marble: "#f6eee6",
} as const;
