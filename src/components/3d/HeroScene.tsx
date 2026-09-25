"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { AdaptiveDpr, ContactShadows, Float, Html, Line, Sparkles, useProgress } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import { StudioLighting } from "@/components/3d/Lighting";
import { CameraRig } from "@/components/3d/CameraRig";
import { ArchImage, archOutline, archShape } from "@/components/3d/ArchImage";
import { GlbModel } from "@/components/3d/GlbModel";
import { PALETTE } from "@/components/3d/materials";
import type { ShowcaseItem } from "@/lib/queries";

// Where each piece stands on the plinth (units; plinth top at y = 0).
// Mirrors the static stage: tall centre arch, a smaller one to the side and
// a third lifted on the other side.
const SLOTS = [
  { position: [0, 0.02, 0.15] as const, width: 1.56, height: 2.3, rotationY: 0, float: 0.05 },
  { position: [-1.5, 0.02, -0.35] as const, width: 1.08, height: 1.58, rotationY: 0.2, float: 0.08 },
  { position: [1.52, 0.62, -0.3] as const, width: 1.02, height: 1.5, rotationY: -0.2, float: 0.14 },
];

const PLINTH_RADIUS = 2.05;
const CAMERA: [number, number, number] = [0, 1.25, 8.6];

type HeroSceneProps = {
  items: ShowcaseItem[];
  locale: string;
  reducedMotion: boolean;
  active: boolean;
  progress: MotionValue<number>;
  mirror?: boolean;
  onReady?: () => void;
  // 0–100 while textures/models load, for the page's loading indicator.
  onProgress?: (percent: number) => void;
};

// The WebGL boutique stage (desktop, capable GPUs only). The pieces are
// DODANA's real product photos framed as arches — or a product's real .glb
// model when one has been uploaded. No invented/generic products.
export default function HeroScene({
  items,
  locale,
  reducedMotion,
  active,
  progress,
  mirror = false,
  onReady,
  onProgress,
}: HeroSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      performance={{ min: 0.6 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: CAMERA, fov: 30 }}
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
    >
      <Suspense fallback={null}>
        <StudioLighting quality="high" />
        <Stage items={items} locale={locale} animate={!reducedMotion} progress={progress} mirror={mirror} />
        {!reducedMotion && (
          <Sparkles count={18} scale={[5, 3.6, 2.5]} position={[0, 0.6, 0.4]} size={2.2} speed={0.18} opacity={0.5} color="#e3c28f" />
        )}
        <AdaptiveDpr pixelated={false} />
        {onReady && <ReadySignal onReady={onReady} />}
      </Suspense>
      {onProgress && <ProgressReporter onProgress={onProgress} />}
      <CameraRig base={CAMERA} lookAt={[0, 0.35, 0]} progress={progress} followAmount={0.35} scrollDolly={0.5} enabled={!reducedMotion} />
    </Canvas>
  );
}

function Stage({
  items,
  locale,
  animate,
  progress,
  mirror,
}: {
  items: ShowcaseItem[];
  locale: string;
  animate: boolean;
  progress: MotionValue<number>;
  mirror: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const viewport = useThree((s) => s.viewport);
  // Fit the composition (~4.7 wide, ~3.3 tall from plinth to tallest arch)
  // inside the canvas with generous air around it.
  const scale = THREE.MathUtils.clamp(Math.min((viewport.width * 0.9) / 4.7, (viewport.height * 0.74) / 3.3), 0.45, 1.15);
  const baseY = -(3.0 * scale) / 2 + 0.5;

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const p = animate ? progress.get() : 0;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, p * 0.25, 3, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, baseY + p * 0.4, 3, delta);
  });

  const backdrop = useMemo(() => normalizedShapeGeometry(archShape(3.5, 3.4)), []);
  const backdropEdge = useMemo(() => archOutline(3.5, 3.4, 0.14), []);
  const backdropTexture = useMemo(() => verticalGradientTexture(), []);
  const dir = mirror ? -1 : 1;

  return (
    <group ref={group} position={[0, baseY, 0]} scale={scale}>
      {/* blush plaster arch + gold echo behind the pieces */}
      <mesh position={[0, 0, -1.3]}>
        <primitive object={backdrop} attach="geometry" />
        <meshBasicMaterial map={backdropTexture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <Line points={backdropEdge} color={PALETTE.gold} lineWidth={1} transparent opacity={0.45} position={[0, 0, -1.29]} />

      <Plinth />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.32} scale={6} blur={2.8} far={2.2} resolution={512} color="#6b4a3d" frames={animate ? Infinity : 1} />

      {items.slice(0, SLOTS.length).map((item, i) => {
        const slot = SLOTS[i]!;
        return (
          <Piece
            key={item.id}
            item={item}
            label={locale === "ar" ? item.nameAr : item.nameEn}
            position={[slot.position[0] * dir, slot.position[1], slot.position[2]]}
            rotationY={slot.rotationY * dir}
            width={slot.width}
            height={slot.height}
            floatIntensity={slot.float}
            animate={animate}
          />
        );
      })}
    </group>
  );
}

// ShapeGeometry's UVs are raw shape coordinates; remap them to 0–1 over the
// shape's bounds so a texture spans it exactly once.
function normalizedShapeGeometry(shape: THREE.Shape) {
  const geometry = new THREE.ShapeGeometry(shape, 48);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
  const w = box.max.x - box.min.x || 1;
  const h = box.max.y - box.min.y || 1;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - box.min.x) / w, (pos.getY(i) - box.min.y) / h);
  uv.needsUpdate = true;
  return geometry;
}

// Blush (top) → sand → transparent (bottom), mapped over the arch's bounds so
// the backdrop melts into the page background instead of reading as a slab.
function verticalGradientTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "rgba(245, 222, 220, 0.95)");
    g.addColorStop(0.55, "rgba(240, 226, 212, 0.75)");
    g.addColorStop(1, "rgba(247, 239, 232, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Plinth() {
  return (
    <group>
      <mesh position={[0, -0.11, 0]} receiveShadow>
        <cylinderGeometry args={[PLINTH_RADIUS, PLINTH_RADIUS * 1.015, 0.22, 96]} />
        <meshPhysicalMaterial color={PALETTE.marble} roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.25} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[PLINTH_RADIUS - 0.01, 0.012, 12, 160]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={1} roughness={0.22} envMapIntensity={1.2} />
      </mesh>
    </group>
  );
}

function Piece({
  item,
  label,
  position,
  rotationY,
  width,
  height,
  floatIntensity,
  animate,
}: {
  item: ShowcaseItem;
  label: string;
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
  floatIntensity: number;
  animate: boolean;
}) {
  const router = useRouter();
  const inner = useRef<THREE.Group>(null);
  const hover = useRef(0);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    hover.current = THREE.MathUtils.damp(hover.current, hovered ? 1 : 0, 6, delta);
    const g = inner.current;
    if (!g) return;
    g.position.z = hover.current * 0.22;
    g.scale.setScalar(1 + hover.current * 0.035);
    if (item.modelUrl && animate) g.rotation.y += delta * 0.25;
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    setHovered(false);
    document.body.style.cursor = "";
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Float enabled={animate} speed={1} rotationIntensity={0} floatIntensity={floatIntensity} floatingRange={[0, 0.06]}>
        <group
          ref={inner}
          onPointerOver={onOver}
          onPointerOut={onOut}
          onClick={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "";
            router.push(item.href);
          }}
        >
          {item.modelUrl ? (
            // A product stands a little shorter than the arch it replaces.
            <GlbModel url={item.modelUrl} size={height * 0.78} align="base" />
          ) : (
            <ArchImage src={item.image} width={width} height={height} hover={hover} animate={animate} />
          )}
        </group>
      </Float>
      <Html position={[0, -0.12, 0.4]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <span
          className="block w-max max-w-[14rem] truncate rounded-full bg-ivory/90 px-3 py-1 text-[11px] font-medium text-mocha-700 shadow-soft backdrop-blur transition-opacity duration-500"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          {label}
        </span>
      </Html>
    </group>
  );
}

// Mounted inside the Suspense boundary, so it only runs once every texture /
// model and the environment map are ready; fires after the first frame is on
// screen so the static stage can crossfade out without a blank flash.
function ReadySignal({ onReady }: { onReady: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    requestAnimationFrame(() => onReady());
  });
  return null;
}

function ProgressReporter({ onProgress }: { onProgress: (percent: number) => void }) {
  const percent = useProgress((s) => s.progress);
  useEffect(() => onProgress(percent), [percent, onProgress]);
  return null;
}
