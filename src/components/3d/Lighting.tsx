"use client";

import { Environment, Lightformer } from "@react-three/drei";
import type { SceneQuality } from "@/components/3d/materials";

// Soft beauty-studio lighting. Reflections come from an environment map
// rendered locally from a few light panels (Lightformers) — no remote HDR
// download — and it's rendered once (frames={1}) since the studio is static.
export function StudioLighting({ quality }: { quality: SceneQuality }) {
  return (
    <>
      <ambientLight intensity={0.55} color="#fff4ec" />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#fff1e6" />
      <directionalLight position={[-5, 3, -3]} intensity={0.7} color="#f7cfc8" />
      <Environment resolution={quality === "high" ? 256 : 128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#fff6ee" position={[0, 5, 2]} rotation-x={Math.PI / 2.4} scale={[10, 2.5, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#ffd9d2" position={[-6, 1.5, 1]} rotation-y={Math.PI / 2} scale={[4, 7, 1]} />
        <Lightformer form="rect" intensity={2} color="#fff0db" position={[6, 1, 0]} rotation-y={-Math.PI / 2} scale={[4, 7, 1]} />
        <Lightformer form="ring" intensity={1.4} color="#f3dcc2" position={[0, 1, -7]} scale={5} />
        <Lightformer form="rect" intensity={0.8} color="#f5e6da" position={[0, -3, 2]} rotation-x={-Math.PI / 2} scale={[10, 4, 1]} />
      </Environment>
    </>
  );
}
