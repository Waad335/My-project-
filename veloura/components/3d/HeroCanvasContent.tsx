"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, RoundedBox, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const GOLD = "#b08d4f";
const IVORY = "#f7f2e9";
const BROWN = "#3a2c1e";

interface CardDef {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
  color: string;
  floatSpeed: number;
  floatRange: number;
  metalness: number;
  roughness: number;
}

const cards: CardDef[] = [
  {
    position: [-1.6, 0.4, 0],
    rotation: [0.15, 0.5, -0.12],
    size: [1.7, 2.3, 0.05],
    color: IVORY,
    floatSpeed: 0.6,
    floatRange: 0.35,
    metalness: 0.1,
    roughness: 0.35,
  },
  {
    position: [1.3, -0.3, -0.6],
    rotation: [-0.1, -0.4, 0.1],
    size: [1.5, 2.0, 0.05],
    color: "#efe6d6",
    floatSpeed: 0.5,
    floatRange: 0.3,
    metalness: 0.15,
    roughness: 0.4,
  },
  {
    position: [0.1, 0.9, -1.2],
    rotation: [0.25, 0.2, 0.08],
    size: [1.1, 1.5, 0.04],
    color: BROWN,
    floatSpeed: 0.4,
    floatRange: 0.25,
    metalness: 0.3,
    roughness: 0.5,
  },
  {
    position: [-0.6, -1.1, -0.4],
    rotation: [-0.2, 0.3, -0.05],
    size: [0.9, 1.25, 0.04],
    color: GOLD,
    floatSpeed: 0.7,
    floatRange: 0.2,
    metalness: 0.6,
    roughness: 0.25,
  },
];

function FloatingCard({ def, index }: { def: CardDef; index: number }) {
  return (
    <Float
      speed={def.floatSpeed}
      rotationIntensity={0.35}
      floatIntensity={def.floatRange}
      floatingRange={[-0.15, 0.15]}
    >
      <RoundedBox
        args={def.size}
        radius={0.05}
        smoothness={4}
        position={def.position}
        rotation={def.rotation}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={def.color}
          metalness={def.metalness}
          roughness={def.roughness}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
        />
      </RoundedBox>
      {/* thin gold rule accent on the card face, evokes premium letterpress */}
      <mesh position={[def.position[0], def.position[1] - def.size[1] / 2 + 0.28, def.position[2] + def.size[2] / 2 + 0.001]} rotation={def.rotation}>
        <planeGeometry args={[def.size[0] * 0.5, 0.02]} />
        <meshBasicMaterial color={GOLD} opacity={index % 2 === 0 ? 0.7 : 0} transparent />
      </mesh>
    </Float>
  );
}

/** Camera + lighting rig that responds subtly to pointer position and page scroll. */
function Rig({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const scroll = scrollProgress.current;
    target.set(pointer.x * 0.5, pointer.y * 0.3 - scroll * 1.2, 5 - scroll * 1.5);
    camera.position.lerp(target, 0.04);
    camera.lookAt(0, -scroll * 0.6, 0);
  });

  return null;
}

export function HeroCanvasContent({
  scrollProgress,
}: {
  scrollProgress: React.MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <>
      <color attach="background" args={["#00000000"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#fff4e0" castShadow />
      <pointLight position={[-4, -2, 2]} intensity={0.4} color={GOLD} />

      <group ref={group}>
        {cards.map((def, i) => (
          <FloatingCard key={i} def={def} index={i} />
        ))}
      </group>

      <ContactShadows position={[0, -2.1, 0]} opacity={0.35} scale={10} blur={2.5} far={3} color="#000000" />
      <Rig scrollProgress={scrollProgress} />
    </>
  );
}
