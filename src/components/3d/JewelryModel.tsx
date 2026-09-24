"use client";

import { useMemo } from "react";
import { GlassMaterial, GoldMaterial, PearlMaterial, type SceneQuality } from "@/components/3d/materials";

export function JewelryModel({ quality, variant }: { quality: SceneQuality; variant: "ring" | "necklace" }) {
  return variant === "ring" ? <Ring quality={quality} /> : <PearlNecklace />;
}

// Solitaire: gold band standing upright with a faceted blush stone.
function Ring({ quality }: { quality: SceneQuality }) {
  return (
    <group position={[0, 0.42, 0]}>
      <mesh>
        <torusGeometry args={[0.36, 0.055, 32, 110]} />
        <GoldMaterial roughness={0.16} />
      </mesh>
      <mesh position={[0, 0.43, 0]}>
        <coneGeometry args={[0.1, 0.12, 24]} />
        <GoldMaterial roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.56, 0]} scale={[1, 1.15, 1]}>
        <octahedronGeometry args={[0.15, 0]} />
        <GlassMaterial quality={quality} tint="#ffd6d0" flatShading />
      </mesh>
    </group>
  );
}

// Strand of pearls draped in a soft ellipse with a larger drop pearl.
function PearlNecklace() {
  const pearls = useMemo(() => {
    const count = 22;
    return Array.from({ length: count }, (_, i) => {
      const t = Math.PI * 0.12 + (i / (count - 1)) * Math.PI * 1.76;
      return [Math.cos(t) * 0.62, 0.66 - Math.sin(t) * 0.48, 0] as [number, number, number];
    });
  }, []);

  return (
    <group>
      {pearls.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.068, 20, 20]} />
          <PearlMaterial />
        </mesh>
      ))}
      <mesh position={[0, 0.07, 0]}>
        <sphereGeometry args={[0.12, 28, 28]} />
        <PearlMaterial />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.035, 0.01, 10, 24]} />
        <GoldMaterial />
      </mesh>
    </group>
  );
}
