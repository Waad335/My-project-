"use client";

// Shared material presets for the procedural product models. "high" quality
// uses physically-based transmission (real refraction through glass); "low"
// swaps it for cheap alpha transparency so phones and low-power laptops skip
// the extra transmission render pass entirely.
export type SceneQuality = "high" | "low";

export const PALETTE = {
  gold: "#d6b27c",
  goldDeep: "#b98f55",
  champagne: "#e8d5b5",
  glassTint: "#fff4f0",
  liquid: "#eab2a8",
  liquidAmber: "#e2b38a",
  rose: "#b8605a",
  ivoryLacquer: "#f5ece3",
  cream: "#efe2d6",
  mocha: "#4f352b",
  leather: "#d6b196",
  leatherDeep: "#b98b72",
  pearl: "#fbf1ea",
  marble: "#f6eee6",
  marbleBase: "#eadacb",
} as const;

export function GlassMaterial({
  quality,
  tint = PALETTE.glassTint,
  flatShading = false,
}: {
  quality: SceneQuality;
  tint?: string;
  flatShading?: boolean;
}) {
  if (quality === "high") {
    return (
      <meshPhysicalMaterial
        color={tint}
        transmission={1}
        thickness={0.6}
        roughness={0.05}
        ior={1.5}
        clearcoat={1}
        clearcoatRoughness={0.04}
        attenuationColor="#f7d6cf"
        attenuationDistance={2.2}
        envMapIntensity={1.35}
        flatShading={flatShading}
      />
    );
  }
  return (
    <meshPhysicalMaterial
      color={tint}
      transparent
      opacity={0.42}
      roughness={0.06}
      clearcoat={1}
      envMapIntensity={1.6}
      depthWrite={false}
      flatShading={flatShading}
    />
  );
}

export function LiquidMaterial({ color = PALETTE.liquid }: { color?: string }) {
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={0.6} transparent opacity={0.92} />;
}

export function GoldMaterial({ roughness = 0.22, color = PALETTE.gold }: { roughness?: number; color?: string }) {
  return <meshStandardMaterial color={color} metalness={1} roughness={roughness} envMapIntensity={1.25} />;
}

export function FrostedMaterial({ quality, color = PALETTE.ivoryLacquer }: { quality: SceneQuality; color?: string }) {
  return quality === "high" ? (
    <meshPhysicalMaterial color={color} roughness={0.42} transmission={0.55} thickness={0.8} clearcoat={0.4} />
  ) : (
    <meshPhysicalMaterial color={color} roughness={0.42} clearcoat={0.4} />
  );
}

export function LacquerMaterial({ color = PALETTE.ivoryLacquer }: { color?: string }) {
  return <meshPhysicalMaterial color={color} roughness={0.32} clearcoat={1} clearcoatRoughness={0.12} />;
}

export function LeatherMaterial({ color = PALETTE.leather }: { color?: string }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.62}
      sheen={0.6}
      sheenColor="#ffe6d8"
      sheenRoughness={0.5}
      clearcoat={0.12}
    />
  );
}

export function PearlMaterial() {
  return (
    <meshPhysicalMaterial
      color={PALETTE.pearl}
      roughness={0.18}
      clearcoat={1}
      clearcoatRoughness={0.08}
      iridescence={0.55}
      iridescenceIOR={1.3}
      sheen={0.4}
      sheenColor="#ffe9f0"
    />
  );
}
