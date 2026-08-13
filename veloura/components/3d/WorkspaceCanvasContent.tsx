"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const GOLD = "#b08d4f";
const IVORY = "#f7f2e9";
const CHARCOAL = "#23201c";
const BROWN = "#4a3b2c";

function Desk() {
  return (
    <mesh position={[0, -1.4, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial color={CHARCOAL} roughness={0.9} />
    </mesh>
  );
}

function HoverableGroup({
  children,
  hoverScale = 1.04,
  position,
  rotation,
}: {
  children: React.ReactNode;
  hoverScale?: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!ref.current) return;
    const target = hovered ? hoverScale : 1;
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
  });

  return (
    <group
      ref={ref}
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {children}
    </group>
  );
}

function LaptopBase() {
  return (
    <HoverableGroup position={[1.6, -1.15, -0.8]} rotation={[0, -0.35, 0]}>
      <RoundedBox args={[2.6, 0.12, 1.8]} radius={0.04} castShadow receiveShadow>
        <meshStandardMaterial color="#d8d2c4" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <RoundedBox
        args={[2.6, 1.7, 0.1]}
        radius={0.04}
        position={[0, 0.85, -0.85]}
        rotation={[-0.18, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color="#e4ddd0" metalness={0.5} roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, 0.85, -0.8]} rotation={[-0.18, 0, 0]}>
        <planeGeometry args={[2.3, 1.4]} />
        <meshBasicMaterial color={GOLD} opacity={0.15} transparent />
      </mesh>
    </HoverableGroup>
  );
}

function ResumeDocument() {
  return (
    <HoverableGroup position={[-1.5, -1.3, 0.6]} rotation={[-Math.PI / 2 + 0.05, 0, 0.18]}>
      <RoundedBox args={[1.5, 2.1, 0.03]} radius={0.02} castShadow receiveShadow>
        <meshPhysicalMaterial color={IVORY} roughness={0.6} clearcoat={0.2} />
      </RoundedBox>
      {[0.7, 0.5, 0.3, 0.1, -0.1, -0.3, -0.5].map((y, i) => (
        <mesh key={i} position={[0, y, 0.02]}>
          <planeGeometry args={[i === 0 ? 0.7 : 1.1, 0.05]} />
          <meshBasicMaterial color={i === 0 ? GOLD : "#8a7c67"} opacity={0.7} transparent />
        </mesh>
      ))}
    </HoverableGroup>
  );
}

function BusinessCard() {
  return (
    <HoverableGroup position={[0.3, -1.32, 1.8]} rotation={[-Math.PI / 2, 0, -0.3]}>
      <RoundedBox args={[0.9, 0.55, 0.02]} radius={0.03} castShadow receiveShadow>
        <meshPhysicalMaterial color={BROWN} metalness={0.2} roughness={0.4} clearcoat={0.5} />
      </RoundedBox>
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[0.5, 0.06]} />
        <meshBasicMaterial color={GOLD} />
      </mesh>
    </HoverableGroup>
  );
}

function GoldPen() {
  return (
    <HoverableGroup position={[-0.3, -1.28, 1.9]} rotation={[0, 0, Math.PI / 2.6]} hoverScale={1.15}>
      <mesh castShadow>
        <cylinderGeometry args={[0.028, 0.028, 1.4, 16]} />
        <meshPhysicalMaterial color={GOLD} metalness={0.9} roughness={0.15} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <coneGeometry args={[0.028, 0.12, 16]} />
        <meshPhysicalMaterial color="#3a2c1e" metalness={0.4} roughness={0.3} />
      </mesh>
    </HoverableGroup>
  );
}

function Rig({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const { camera, pointer } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame(() => {
    const scroll = scrollProgress.current;
    target.current.set(
      pointer.x * 0.6 + scroll * 0.8,
      0.8 - scroll * 0.9 + pointer.y * 0.2,
      5.2 - scroll * 1.6
    );
    camera.position.lerp(target.current, 0.04);
    camera.lookAt(0, -0.6, 0);
  });

  return null;
}

export function WorkspaceCanvasContent({
  scrollProgress,
}: {
  scrollProgress: React.MutableRefObject<number>;
}) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} color="#fff2dc" castShadow />
      <pointLight position={[-3, 1, 2]} intensity={0.5} color={GOLD} />
      <spotLight position={[0, 4, 2]} angle={0.5} penumbra={1} intensity={0.6} color="#fff8ea" />

      <Desk />
      <LaptopBase />
      <ResumeDocument />
      <BusinessCard />
      <GoldPen />

      <ContactShadows position={[0, -1.39, 0]} opacity={0.5} scale={12} blur={2} far={4} />
      <Rig scrollProgress={scrollProgress} />
    </>
  );
}
