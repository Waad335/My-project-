"use client";

import { GoldMaterial, PALETTE } from "@/components/3d/materials";

// Two-tier marble display plinth with a gold rim. Origin at the floor; the
// display surface sits at PEDESTAL_TOP.
export const PEDESTAL_TOP = 0.66;

export function Pedestal({ radius = 1.5 }: { radius?: number }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[radius + 0.25, radius + 0.28, 0.16, 96]} />
        <meshPhysicalMaterial color={PALETTE.marbleBase} roughness={0.5} clearcoat={0.3} />
      </mesh>
      <mesh position={[0, 0.405, 0]}>
        <cylinderGeometry args={[radius, radius, 0.5, 96]} />
        <meshPhysicalMaterial color={PALETTE.marble} roughness={0.26} clearcoat={0.7} clearcoatRoughness={0.2} />
      </mesh>
      <mesh position={[0, 0.655, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.016, 12, 128]} />
        <GoldMaterial roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.162, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius + 0.265, 0.012, 12, 128]} />
        <GoldMaterial roughness={0.25} />
      </mesh>
    </group>
  );
}
