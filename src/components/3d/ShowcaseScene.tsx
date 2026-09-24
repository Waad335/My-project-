"use client";

import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import { StudioLighting } from "@/components/3d/Lighting";
import { PerfumeModel } from "@/components/3d/PerfumeModel";
import { GoldMaterial, PALETTE, type SceneQuality } from "@/components/3d/materials";
import type { SceneLayout } from "@/hooks/use-3d-capability";

type ShowcaseSceneProps = {
  quality: SceneQuality;
  layout: SceneLayout;
  reducedMotion: boolean;
  active: boolean;
  // Scroll progress (0 → 1) through the pinned showcase section.
  progress: MotionValue<number>;
};

// A single hero bottle choreographed by scroll: it drifts across the frame
// while turning, the camera pushes in for the close-up, then settles back.
export default function ShowcaseScene({ quality, layout, reducedMotion, active, progress }: ShowcaseSceneProps) {
  const wide = layout === "wide";
  return (
    <Canvas
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      gl={{ alpha: true, antialias: quality === "high", powerPreference: "high-performance" }}
      camera={{ position: [0, 0.6, 7], fov: wide ? 32 : 40 }}
      frameloop={!active ? "never" : "always"}
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <StudioLighting quality={quality} />
        <Choreography quality={quality} wide={wide} reducedMotion={reducedMotion} progress={progress} />
      </Suspense>
    </Canvas>
  );
}

// Keyframed value over scroll progress, eased with smoothstep between stops.
function keyframe(p: number, stops: [number, number][]): number {
  let prev = stops[0] ?? [0, 0];
  if (p <= prev[0]) return prev[1];
  for (const stop of stops) {
    if (p <= stop[0]) {
      const k = THREE.MathUtils.smoothstep(p, prev[0], stop[0]);
      return prev[1] + (stop[1] - prev[1]) * k;
    }
    prev = stop;
  }
  return prev[1];
}

function Choreography({
  quality,
  wide,
  reducedMotion,
  progress,
}: {
  quality: SceneQuality;
  wide: boolean;
  reducedMotion: boolean;
  progress: MotionValue<number>;
}) {
  const product = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const lookTarget = useRef(new THREE.Vector3());
  const spread = wide ? 1.35 : 0.55;

  useFrame(({ camera }, delta) => {
    const p = progress.get();
    const g = product.current;
    if (g) {
      const x = keyframe(p, [
        [0, spread],
        [0.45, -spread],
        [0.8, 0],
      ]);
      g.position.x = THREE.MathUtils.damp(g.position.x, x, 4, delta);
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, reducedMotion ? 0.4 : p * Math.PI * 2.2, 4, delta);
      g.rotation.z = THREE.MathUtils.damp(g.rotation.z, keyframe(p, [[0, -0.08], [0.45, 0.08], [0.8, 0]]), 4, delta);
    }

    if (rings.current) {
      rings.current.rotation.y += reducedMotion ? 0 : delta * 0.25;
      rings.current.rotation.x = 0.35 + p * 0.6;
      rings.current.position.x = g ? g.position.x : 0;
    }

    const z = keyframe(p, [
      [0, 7.8],
      [0.5, wide ? 6 : 6.6],
      [1, 7],
    ]);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 3, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.6 - p * 0.25, 3, delta);
    lookTarget.current.set(0, 0.25, 0);
    camera.lookAt(lookTarget.current);
  });

  return (
    <group position={[0, -0.85, 0]}>
      <group ref={product} position={[spread, 0, 0]}>
        <Float enabled={!reducedMotion} speed={1} rotationIntensity={0.15} floatIntensity={0.35}>
          <group scale={wide ? 0.95 : 0.8}>
            <PerfumeModel quality={quality} variant="flacon" />
          </group>
        </Float>
      </group>

      {/* Two thin gold orbits framing the bottle. */}
      <group ref={rings} position={[spread, 0.9, 0]}>
        <mesh>
          <torusGeometry args={[1.35, 0.01, 12, 160]} />
          <GoldMaterial roughness={0.2} />
        </mesh>
        <mesh rotation={[Math.PI / 2.6, 0.4, 0]}>
          <torusGeometry args={[1.6, 0.007, 12, 160]} />
          <GoldMaterial roughness={0.3} color={PALETTE.champagne} />
        </mesh>
      </group>

      <ContactShadows
        position={[0, -0.02, 0]}
        opacity={0.28}
        scale={8}
        blur={2.8}
        far={2}
        resolution={quality === "high" ? 512 : 256}
        color="#6b4a3d"
      />
    </group>
  );
}
