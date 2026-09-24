"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";

type CameraRigProps = {
  base: [number, number, number];
  lookAt?: [number, number, number];
  // Scroll progress (0 → 1) of the section hosting the canvas.
  progress?: MotionValue<number>;
  followAmount?: number;
  scrollDolly?: number;
  enabled: boolean;
};

// Eases the camera toward the cursor (tracked across the whole window, not
// just the canvas) and dollies it in/down as the section scrolls away.
export function CameraRig({
  base,
  lookAt = [0, 0.2, 0],
  progress,
  followAmount = 1,
  scrollDolly = 1,
  enabled,
}: CameraRigProps) {
  const { camera } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  const target = useRef(new THREE.Vector3(...lookAt));

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  useFrame((_, delta) => {
    const p = enabled ? progress?.get() ?? 0 : 0;
    const px = enabled ? pointer.current.x * 0.45 * followAmount : 0;
    const py = enabled ? pointer.current.y * 0.25 * followAmount : 0;

    const tx = base[0] + px;
    const ty = base[1] + py - p * 0.9 * scrollDolly;
    const tz = base[2] - p * 1.6 * scrollDolly;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 2.4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 2.4, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, tz, 2.4, delta);

    target.current.set(lookAt[0], lookAt[1] - p * 0.5 * scrollDolly, lookAt[2]);
    camera.lookAt(target.current);
  });

  return null;
}
