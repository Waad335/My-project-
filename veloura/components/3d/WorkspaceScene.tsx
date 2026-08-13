"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, type MutableRefObject } from "react";
import { WorkspaceCanvasContent } from "./WorkspaceCanvasContent";

export default function WorkspaceScene({
  scrollProgress,
}: {
  scrollProgress: MutableRefObject<number>;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.8, 5.2], fov: 45 }}
      shadows
      className="!absolute inset-0"
    >
      <Suspense fallback={null}>
        <WorkspaceCanvasContent scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  );
}
