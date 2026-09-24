"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float } from "@react-three/drei";

// One shared "glow" light travels to whichever product is hovered, instead of
// giving every product its own (always-evaluated) point light.
type GlowTarget = { current: THREE.Vector3 | null };
const HoverGlowContext = createContext<GlowTarget | null>(null);

export function HoverGlowProvider({ children }: { children: React.ReactNode }) {
  const target = useMemo<GlowTarget>(() => ({ current: null }), []);
  return (
    <HoverGlowContext.Provider value={target}>
      {children}
      <HoverGlowLight target={target} />
    </HoverGlowContext.Provider>
  );
}

function HoverGlowLight({ target }: { target: GlowTarget }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame((_, delta) => {
    if (!light.current) return;
    const goal = target.current;
    if (goal) light.current.position.lerp(goal, 1 - Math.exp(-8 * delta));
    light.current.intensity = THREE.MathUtils.damp(light.current.intensity, goal ? 5 : 0, 5, delta);
  });
  return <pointLight ref={light} color="#ffe2cf" distance={3.2} decay={2} intensity={0} />;
}

type FloatingProductProps = {
  children: React.ReactNode;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  animate: boolean;
  spin?: number;
  floatIntensity?: number;
  speed?: number;
  label?: string;
  onSelect?: () => void;
};

// Wraps a model with idle floating/rotation plus hover response: the product
// eases slightly forward and up in scale, turns a little faster, and the
// shared glow light moves onto it.
export function FloatingProduct({
  children,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  animate,
  spin = 0.15,
  floatIntensity = 0.5,
  speed = 1.2,
  label,
  onSelect,
}: FloatingProductProps) {
  const glow = useContext(HoverGlowContext);
  const inner = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const worldPos = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!hovered || !onSelect) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered, onSelect]);

  useFrame((_, delta) => {
    const g = inner.current;
    if (!g) return;
    const targetScale = hovered ? 1.09 : 1;
    const s = THREE.MathUtils.damp(g.scale.x, targetScale, 6, delta);
    g.scale.setScalar(s);
    g.position.z = THREE.MathUtils.damp(g.position.z, hovered ? 0.35 : 0, 6, delta);
    if (animate) g.rotation.y += delta * (spin + (hovered ? 0.6 : 0));
    if (hovered && glow) {
      g.getWorldPosition(worldPos);
      worldPos.z += 1.1;
      worldPos.y += 0.5;
      glow.current = worldPos;
    }
  });

  function handleOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    setHovered(true);
  }
  function handleOut() {
    setHovered(false);
    if (glow) glow.current = null;
  }
  function handleClick(e: ThreeEvent<MouseEvent>) {
    // The canvas shares pointer events with the hero copy above it — never
    // hijack a click that actually landed on a link or button.
    const target = e.nativeEvent.target as HTMLElement | null;
    if (target?.closest("a, button, input, textarea, select")) return;
    e.stopPropagation();
    onSelect?.();
  }

  return (
    <group position={position} rotation={rotation} scale={scale} name={label}>
      <Float enabled={animate} speed={speed} floatIntensity={floatIntensity} rotationIntensity={animate ? 0.35 : 0}>
        <group ref={inner} onPointerOver={handleOver} onPointerOut={handleOut} onClick={handleClick}>
          {children}
        </group>
      </Float>
    </group>
  );
}
