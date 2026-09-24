"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import {
  FrostedMaterial,
  GlassMaterial,
  GoldMaterial,
  LacquerMaterial,
  LiquidMaterial,
  PALETTE,
  type SceneQuality,
} from "@/components/3d/materials";

export type CosmeticVariant = "serum" | "jar" | "lipstick" | "pump";

export function CosmeticModel({ quality, variant }: { quality: SceneQuality; variant: CosmeticVariant }) {
  switch (variant) {
    case "serum":
      return <SerumBottle quality={quality} />;
    case "jar":
      return <CreamJar quality={quality} />;
    case "lipstick":
      return <Lipstick />;
    case "pump":
      return <PumpBottle />;
  }
}

function SerumBottle({ quality }: { quality: SceneQuality }) {
  const body = useMemo(
    () =>
      [
        [0, 0],
        [0.3, 0],
        [0.32, 0.03],
        [0.32, 0.8],
        [0.27, 0.92],
        [0.12, 0.98],
        [0.12, 1.04],
        [0, 1.04],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    []
  );
  return (
    <group>
      <mesh>
        <latheGeometry args={[body, 64]} />
        <GlassMaterial quality={quality} tint="#fff0e6" />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.6, 48]} />
        <LiquidMaterial color={PALETTE.liquidAmber} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.16, 40]} />
        <GoldMaterial />
      </mesh>
      <mesh position={[0, 1.36, 0]}>
        <capsuleGeometry args={[0.12, 0.24, 8, 24]} />
        <meshPhysicalMaterial color={PALETTE.mocha} roughness={0.68} clearcoat={0.2} />
      </mesh>
    </group>
  );
}

function CreamJar({ quality }: { quality: SceneQuality }) {
  return (
    <group>
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.52, 0.5, 0.42, 64]} />
        <FrostedMaterial quality={quality} color="#f7ebe4" />
      </mesh>
      <mesh position={[0, 0.51, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.2, 64]} />
        <GoldMaterial roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.615, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.012, 64]} />
        <GoldMaterial roughness={0.16} color={PALETTE.champagne} />
      </mesh>
    </group>
  );
}

// Classic slanted-bullet lipstick: the bullet's top ring of vertices is
// sheared so the tip is cut at an angle.
function Lipstick() {
  const bullet = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.105, 0.105, 0.36, 40, 1);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0) pos.setY(i, pos.getY(i) - (pos.getX(i) + 0.105) * 0.75);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => () => bullet.dispose(), [bullet]);

  return (
    <group>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.56, 48]} />
        <GoldMaterial roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.135, 0.135, 0.2, 48]} />
        <GoldMaterial roughness={0.35} color={PALETTE.goldDeep} />
      </mesh>
      <mesh geometry={bullet} position={[0, 0.94, 0]}>
        <meshPhysicalMaterial color={PALETTE.rose} roughness={0.34} clearcoat={0.6} clearcoatRoughness={0.2} />
      </mesh>
    </group>
  );
}

function PumpBottle() {
  const shoulder = useMemo(
    () =>
      [
        [0, 0],
        [0.34, 0],
        [0.36, 0.04],
        [0.36, 1.02],
        [0.3, 1.12],
        [0.16, 1.16],
        [0, 1.16],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    []
  );
  return (
    <group>
      <mesh>
        <latheGeometry args={[shoulder, 64]} />
        <LacquerMaterial color={PALETTE.cream} />
      </mesh>
      <mesh position={[0, 0.55, 0.358]}>
        <boxGeometry args={[0.3, 0.44, 0.004]} />
        <meshStandardMaterial color={PALETTE.champagne} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.14, 40]} />
        <GoldMaterial />
      </mesh>
      <mesh position={[0, 1.38, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.2, 20]} />
        <GoldMaterial roughness={0.3} />
      </mesh>
      <RoundedBox args={[0.2, 0.12, 0.46]} radius={0.04} smoothness={3} position={[0, 1.52, 0.1]}>
        <GoldMaterial roughness={0.24} />
      </RoundedBox>
    </group>
  );
}
