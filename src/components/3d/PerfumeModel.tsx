"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { GlassMaterial, GoldMaterial, LiquidMaterial, PALETTE, type SceneQuality } from "@/components/3d/materials";

// All product models share one convention: origin at the base centre (y = 0
// is the surface the object stands on), so they can be placed on the pedestal
// or floated without per-model offsets.

type PerfumeProps = { quality: SceneQuality; variant?: "classic" | "flacon" };

export function PerfumeModel({ quality, variant = "classic" }: PerfumeProps) {
  return variant === "classic" ? <ClassicBottle quality={quality} /> : <FlaconBottle quality={quality} />;
}

// Rectangular bottle with a chunky square gold cap.
function ClassicBottle({ quality }: { quality: SceneQuality }) {
  return (
    <group>
      <RoundedBox args={[1, 1.2, 0.62]} radius={0.14} smoothness={5} position={[0, 0.6, 0]}>
        <GlassMaterial quality={quality} />
      </RoundedBox>
      <RoundedBox args={[0.82, 0.86, 0.44]} radius={0.1} smoothness={4} position={[0, 0.48, 0]}>
        <LiquidMaterial />
      </RoundedBox>
      <RoundedBox args={[0.4, 0.1, 0.012]} radius={0.004} smoothness={2} position={[0, 0.66, 0.316]}>
        <GoldMaterial roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 1.27, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.14, 32]} />
        <GoldMaterial />
      </mesh>
      <mesh position={[0, 1.215, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.022, 16, 48]} />
        <GoldMaterial />
      </mesh>
      <RoundedBox args={[0.5, 0.46, 0.5]} radius={0.1} smoothness={4} position={[0, 1.56, 0]}>
        <GoldMaterial roughness={0.28} color={PALETTE.gold} />
      </RoundedBox>
    </group>
  );
}

// Round lathe-turned flacon with a faceted crystal stopper.
function FlaconBottle({ quality }: { quality: SceneQuality }) {
  const bodyPoints = useMemo(
    () =>
      [
        [0, 0],
        [0.42, 0],
        [0.6, 0.12],
        [0.68, 0.38],
        [0.66, 0.68],
        [0.52, 0.92],
        [0.28, 1.05],
        [0.16, 1.1],
        [0.15, 1.2],
        [0, 1.2],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    []
  );
  const liquidPoints = useMemo(
    () =>
      [
        [0, 0.06],
        [0.36, 0.06],
        [0.52, 0.16],
        [0.58, 0.38],
        [0.56, 0.62],
        [0.46, 0.76],
        [0, 0.76],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    []
  );

  return (
    <group>
      <mesh>
        <latheGeometry args={[bodyPoints, 72]} />
        <GlassMaterial quality={quality} />
      </mesh>
      <mesh>
        <latheGeometry args={[liquidPoints, 64]} />
        <LiquidMaterial color={PALETTE.liquid} />
      </mesh>
      <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.028, 16, 48]} />
        <GoldMaterial />
      </mesh>
      <mesh position={[0, 1.52, 0]} scale={[1, 1.25, 1]}>
        <icosahedronGeometry args={[0.3, 0]} />
        <GlassMaterial quality={quality} tint="#ffe3dd" flatShading />
      </mesh>
    </group>
  );
}
