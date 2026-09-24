"use client";

import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls, useProgress } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { StudioLighting } from "@/components/3d/Lighting";
import { GlbModel } from "@/components/3d/GlbModel";
import type { SceneQuality } from "@/components/3d/materials";

export type ViewerAction = "front" | "side" | "back" | "top" | "zoom-in" | "zoom-out" | "reset";
export type ViewerCommand = { id: number; action: ViewerAction } | null;

type ProductViewerSceneProps = {
  // The product's real 3D model (.glb).
  modelUrl: string;
  loadingLabel: string;
  quality: SceneQuality;
  autoRotate: boolean;
  command: ViewerCommand;
};

const DISTANCE = 5;
const MIN_DISTANCE = 2.6;
const MAX_DISTANCE = 8;
// Models are normalised to this size so every product frames the same way.
const TARGET_SIZE = 2.2;

const VIEWS: Record<"front" | "side" | "back" | "top", THREE.Vector3> = {
  front: new THREE.Vector3(0, 0.9, DISTANCE),
  side: new THREE.Vector3(DISTANCE, 0.9, 0),
  back: new THREE.Vector3(0, 0.9, -DISTANCE),
  top: new THREE.Vector3(0.01, DISTANCE, 0.6),
};

// Interactive single-product stage: drag to rotate, wheel/pinch to zoom,
// plus programmatic angle presets driven from the surrounding UI.
export default function ProductViewerScene({ modelUrl, loadingLabel, quality, autoRotate, command }: ProductViewerSceneProps) {
  return (
    <Canvas
      dpr={quality === "high" ? [1, 2] : [1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: VIEWS.front.toArray(), fov: 35 }}
    >
      <Suspense fallback={<ModelLoader label={loadingLabel} />}>
        <StudioLighting quality={quality} />
        <GlbModel url={modelUrl} size={TARGET_SIZE} align="center" />
        <ContactShadows
          position={[0, -TARGET_SIZE / 2 - 0.02, 0]}
          opacity={0.3}
          scale={6}
          blur={2.4}
          far={2.5}
          resolution={512}
          color="#6b4a3d"
        />
      </Suspense>
      <ViewerControls autoRotate={autoRotate} command={command} />
    </Canvas>
  );
}

// Shown inside the canvas while the model downloads.
function ModelLoader({ label }: { label: string }) {
  const progress = useProgress((st) => st.progress);
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2" role="status">
        <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.28em] text-mocha-600">{label}</span>
        <span className="relative block h-px w-28 overflow-hidden bg-gold-400/25">
          <span className="absolute inset-y-0 start-0 bg-gold-500 transition-[width] duration-300" style={{ width: `${Math.max(6, progress)}%` }} />
        </span>
      </div>
    </Html>
  );
}

function ViewerControls({ autoRotate, command }: { autoRotate: boolean; command: ViewerCommand }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const goal = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (!command) return;
    const current = camera.position.clone();
    switch (command.action) {
      case "zoom-in":
      case "zoom-out": {
        const factor = command.action === "zoom-in" ? 0.78 : 1.28;
        const len = THREE.MathUtils.clamp(current.length() * factor, MIN_DISTANCE, MAX_DISTANCE);
        goal.current = current.setLength(len);
        break;
      }
      case "reset":
        goal.current = VIEWS.front.clone();
        break;
      default:
        goal.current = VIEWS[command.action].clone();
    }
  }, [command, camera]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!goal.current || !c) return;
    camera.position.lerp(goal.current, 1 - Math.exp(-6 * delta));
    c.update();
    if (camera.position.distanceTo(goal.current) < 0.01) goal.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI * 0.62}
      autoRotate={autoRotate}
      autoRotateSpeed={1.1}
      // A drag takes over from any in-flight preset animation.
      onStart={() => {
        goal.current = null;
      }}
    />
  );
}
