"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

// A real product model (.glb). Scaled so its largest dimension equals `size`
// and positioned either standing on y = 0 ("base") or centred on the origin.
export function GlbModel({ url, size, align = "center" }: { url: string; size: number; align?: "base" | "center" }) {
  const { scene } = useGLTF(url);
  // Clone so the same asset can appear in more than one place.
  const model = useMemo(() => scene.clone(true), [scene]);
  const outer = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    const o = outer.current;
    if (!o) return;
    model.position.set(0, 0, 0);
    o.scale.setScalar(1);
    const box = new THREE.Box3().setFromObject(model);
    if (box.isEmpty()) return;
    const dims = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = size / Math.max(dims.x, dims.y, dims.z);
    model.position.set(-center.x, align === "base" ? -box.min.y : -center.y, -center.z);
    o.scale.setScalar(scale);
    model.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.castShadow = true;
    });
    invalidate();
  }, [model, size, align, invalidate]);

  return (
    <group ref={outer}>
      <primitive object={model} />
    </group>
  );
}
