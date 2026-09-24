"use client";

import { Suspense, useRef } from "react";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, ContactShadows, Sparkles } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import { StudioLighting } from "@/components/3d/Lighting";
import { CameraRig } from "@/components/3d/CameraRig";
import { FloatingProduct, HoverGlowProvider } from "@/components/3d/FloatingProduct";
import { Pedestal, PEDESTAL_TOP } from "@/components/3d/Pedestal";
import { ProductModel } from "@/components/3d/ProductModel";
import type { ModelKind } from "@/components/3d/model-kind";
import type { SceneQuality } from "@/components/3d/materials";
import type { SceneLayout } from "@/hooks/use-3d-capability";

export type HeroCategoryHrefs = Partial<Record<"perfumes" | "skincare" | "haircare" | "accessories" | "bags", string>>;

type Placement = {
  kind: ModelKind;
  position: [number, number, number];
  scale: number;
  rotation?: [number, number, number];
  spin?: number;
  float?: number;
  category?: keyof HeroCategoryHrefs;
  tier?: "all" | "high";
};

// Composition around the pedestal (units relative to the pedestal floor).
// Kept within roughly x ∈ [-2.2, 2.2], y ∈ [0, 3.3] so it can be fitted to
// any viewport by a single scale factor.
const WIDE: Placement[] = [
  { kind: "perfume", position: [0, PEDESTAL_TOP, 0], scale: 1.05, spin: 0.18, float: 0.1, category: "perfumes" },
  { kind: "flacon", position: [-1.55, 1.6, -0.5], scale: 0.8, category: "perfumes" },
  { kind: "serum", position: [1.5, 1.45, -0.35], scale: 0.85, category: "skincare" },
  { kind: "jar", position: [1.3, 0.25, 1.0], scale: 0.66, category: "skincare" },
  { kind: "lipstick", position: [-1.2, 0.45, 1.05], scale: 0.85, rotation: [0, 0, 0.25] },
  { kind: "handbag", position: [-2.05, 0.3, -1.35], scale: 0.62, spin: 0.08, float: 0.25, category: "bags" },
  { kind: "ring", position: [-0.85, 2.85, 0.2], scale: 0.72, category: "accessories" },
  { kind: "necklace", position: [0.95, 2.8, -0.8], scale: 0.6, category: "accessories", tier: "high" },
  { kind: "pump", position: [2.1, 0.35, -1.35], scale: 0.7, category: "haircare", tier: "high" },
];

const COMPACT: Placement[] = [
  { kind: "perfume", position: [0, PEDESTAL_TOP, 0], scale: 1.05, spin: 0.18, float: 0.1, category: "perfumes" },
  { kind: "flacon", position: [-1.35, 1.65, -0.5], scale: 0.74, category: "perfumes" },
  { kind: "serum", position: [1.3, 1.5, -0.3], scale: 0.78, category: "skincare" },
  { kind: "lipstick", position: [-1.05, 0.4, 0.95], scale: 0.8, rotation: [0, 0, 0.25] },
  { kind: "ring", position: [1.05, 0.45, 0.95], scale: 0.66, category: "accessories" },
];

// Local-space footprint of each composition, used to fit it to the viewport.
const BOUNDS = { wide: { w: 4.8, h: 3.4 }, compact: { w: 3.7, h: 3.2 } };

type HeroSceneProps = {
  quality: SceneQuality;
  layout: SceneLayout;
  reducedMotion: boolean;
  active: boolean;
  progress: MotionValue<number>;
  eventSource?: React.MutableRefObject<HTMLElement>;
  categoryHrefs: HeroCategoryHrefs;
  // RTL: the copy sits on the right, so the composition moves to the left.
  mirror?: boolean;
  onReady?: () => void;
};

export default function HeroScene({
  quality,
  layout,
  reducedMotion,
  active,
  progress,
  eventSource,
  categoryHrefs,
  mirror = false,
  onReady,
}: HeroSceneProps) {
  const wide = layout === "wide";
  return (
    <Canvas
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      performance={{ min: 0.6 }}
      gl={{ alpha: true, antialias: quality === "high", powerPreference: "high-performance" }}
      camera={{ position: wide ? [0, 0.55, 7.6] : [0, 0.5, 7.4], fov: wide ? 34 : 40 }}
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
      eventSource={eventSource}
      eventPrefix="client"
      style={{ pointerEvents: eventSource ? "none" : "auto" }}
    >
      <Suspense fallback={null}>
        <StudioLighting quality={quality} />
        <HoverGlowProvider>
          <Composition
            placements={wide ? WIDE : COMPACT}
            quality={quality}
            layout={layout}
            animate={!reducedMotion}
            progress={progress}
            categoryHrefs={categoryHrefs}
            mirror={mirror}
          />
        </HoverGlowProvider>
        {!reducedMotion && (
          <Sparkles
            count={quality === "high" ? 70 : 24}
            scale={wide ? [6, 5, 4] : [5, 4, 3]}
            position={wide ? [mirror ? -2 : 2, 0.4, 0] : [0, 0.2, 0]}
            size={quality === "high" ? 2.4 : 1.8}
            speed={0.25}
            opacity={0.6}
            color="#e3c28f"
          />
        )}
        {quality === "high" && <AdaptiveDpr pixelated={false} />}
        {onReady && <ReadySignal onReady={onReady} />}
      </Suspense>
      <CameraRig
        base={wide ? [0, 0.55, 7.6] : [0, 0.5, 7.4]}
        lookAt={[0, 0.25, 0]}
        progress={progress}
        followAmount={wide ? 1 : 0.5}
        enabled={!reducedMotion}
      />
    </Canvas>
  );
}

function Composition({
  placements,
  quality,
  layout,
  animate,
  progress,
  categoryHrefs,
  mirror,
}: {
  placements: Placement[];
  quality: SceneQuality;
  layout: SceneLayout;
  animate: boolean;
  progress: MotionValue<number>;
  categoryHrefs: HeroCategoryHrefs;
  mirror: boolean;
}) {
  const router = useRouter();
  const group = useRef<THREE.Group>(null);
  const viewport = useThree((s) => s.viewport);

  // Fit the composition to the canvas. Wide screens: the right half (left in
  // RTL), since the copy overlays the other half. Compact screens: the canvas
  // is its own block below the copy, so the composition is centred in it.
  const wide = layout === "wide";
  const bounds = wide ? BOUNDS.wide : BOUNDS.compact;
  const scale = wide
    ? THREE.MathUtils.clamp(Math.min((viewport.width * 0.44) / bounds.w, (viewport.height * 0.78) / bounds.h), 0.5, 1)
    : THREE.MathUtils.clamp(Math.min((viewport.width * 0.94) / bounds.w, (viewport.height * 0.78) / bounds.h), 0.45, 1.2);
  const baseX = wide ? viewport.width * 0.23 * (mirror ? -1 : 1) : 0;
  // Centre vertically; the pedestal's front edge sits nearer the camera and
  // projects lower, so bias the whole composition up a little.
  const baseY = -(bounds.h * scale) / 2 + (wide ? 0.05 : -0.05);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const p = animate ? progress.get() : 0;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, p * 0.55, 3, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, baseY + p * 0.7, 3, delta);
  });

  const visible = placements.filter((p) => p.tier !== "high" || quality === "high");

  return (
    <group ref={group} position={[baseX, baseY, 0]} scale={scale}>
      <Pedestal />
      <ContactShadows
        position={[0, 0.005, 0]}
        opacity={0.3}
        scale={7}
        blur={2.6}
        far={1.4}
        resolution={quality === "high" ? 512 : 256}
        color="#6b4a3d"
        frames={1}
      />
      {visible.map((p) => {
        const href = p.category ? categoryHrefs[p.category] : undefined;
        return (
          <FloatingProduct
            key={p.kind}
            label={p.kind}
            position={p.position}
            rotation={p.rotation}
            scale={p.scale}
            animate={animate}
            spin={p.spin}
            floatIntensity={p.float ?? 0.55}
            onSelect={href ? () => router.push(href) : undefined}
          >
            <ProductModel kind={p.kind} quality={quality} />
          </FloatingProduct>
        );
      })}
    </group>
  );
}

// Mounted inside the Suspense boundary, so it only runs once every model and
// the environment map are ready; fires after the first frame is on screen so
// the static fallback can crossfade out without a blank flash.
function ReadySignal({ onReady }: { onReady: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    requestAnimationFrame(() => onReady());
  });
  return null;
}
