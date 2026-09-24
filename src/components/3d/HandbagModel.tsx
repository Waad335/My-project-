"use client";

import { RoundedBox } from "@react-three/drei";
import { GoldMaterial, LeatherMaterial, PALETTE } from "@/components/3d/materials";

// Structured top-handle bag: leather body, overlapping front flap, gold clasp
// and an arched handle on gold rings.
export function HandbagModel() {
  return (
    <group>
      <RoundedBox args={[1.7, 1.15, 0.62]} radius={0.16} smoothness={5} position={[0, 0.575, 0]}>
        <LeatherMaterial />
      </RoundedBox>
      <RoundedBox
        args={[1.72, 0.62, 0.08]}
        radius={0.05}
        smoothness={4}
        position={[0, 0.86, 0.3]}
        rotation={[-0.08, 0, 0]}
      >
        <LeatherMaterial color={PALETTE.leatherDeep} />
      </RoundedBox>
      <RoundedBox args={[0.3, 0.17, 0.05]} radius={0.025} smoothness={3} position={[0, 0.58, 0.345]}>
        <GoldMaterial roughness={0.18} />
      </RoundedBox>
      <mesh position={[0, 0.58, 0.372]}>
        <torusGeometry args={[0.045, 0.012, 12, 32]} />
        <GoldMaterial />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <torusGeometry args={[0.52, 0.05, 20, 64, Math.PI]} />
        <LeatherMaterial color={PALETTE.leatherDeep} />
      </mesh>
      {[-0.52, 0.52].map((x) => (
        <mesh key={x} position={[x, 1.15, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.07, 0.018, 12, 32]} />
          <GoldMaterial />
        </mesh>
      ))}
    </group>
  );
}
