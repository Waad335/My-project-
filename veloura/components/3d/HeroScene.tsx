"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, type MutableRefObject } from "react";
import { HeroCanvasContent } from "./HeroCanvasContent";

export default function HeroScene({
  scrollProgress,
}: {
  scrollProgress: MutableRefObject<number>;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 42 }}
      shadows
      className="!absolute inset-0"
    >
      <Suspense fallback={null}>
        <HeroCanvasContent scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  );
}
