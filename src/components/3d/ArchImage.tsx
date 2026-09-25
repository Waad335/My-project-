"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Line, useTexture } from "@react-three/drei";
import { PALETTE } from "@/components/3d/materials";

// Loads photos through Next's image optimizer: resized, same-origin (no CORS
// surprises for remote storage) and cached.
export function optimizedImageUrl(src: string, width = 750) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=80`;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Arch-topped photo: cover-fit sampling, anti-aliased arch mask, a slow
// diagonal light sweep and a hover lift. Unlit and not tone-mapped so the
// product photo keeps its true colours.
const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uPlane;      // plane width, height (world units)
  uniform float uImageAspect;
  uniform float uHover;
  uniform float uSweep;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    // Arch signed distance in plane units (origin at bottom centre).
    vec2 p = vec2((vUv.x - 0.5) * uPlane.x, vUv.y * uPlane.y);
    float r = uPlane.x * 0.5;
    float d;
    if (p.y > uPlane.y - r) {
      d = length(p - vec2(0.0, uPlane.y - r)) - r;
    } else {
      d = max(abs(p.x) - r, -p.y);
    }
    float aa = fwidth(d) * 1.2;
    float mask = 1.0 - smoothstep(-aa, aa, d);
    if (mask <= 0.0) discard;

    // Cover-fit UVs + a touch of zoom on hover.
    vec2 uv = vUv - 0.5;
    float planeAspect = uPlane.x / uPlane.y;
    if (uImageAspect > planeAspect) uv.x *= planeAspect / uImageAspect;
    else uv.y *= uImageAspect / planeAspect;
    uv /= 1.0 + 0.045 * uHover;
    vec3 col = texture2D(uMap, uv + 0.5).rgb;

    // Soft top light + gentle vignette so all photos share one "room".
    col *= mix(0.94, 1.03, smoothstep(0.0, 1.0, vUv.y));
    col += smoothstep(0.1, 0.0, abs((vUv.x + vUv.y * 0.55) - uSweep)) * (0.06 + 0.06 * uHover);

    gl_FragColor = vec4(col, mask * uOpacity);
    #include <colorspace_fragment>
  }
`;

export function archOutline(width: number, height: number, inset = 0, segments = 48): [number, number, number][] {
  const r = width / 2 + inset;
  const top = height - width / 2;
  const pts: [number, number, number][] = [[-r, -inset, 0]];
  for (let i = 0; i <= segments; i++) {
    const a = Math.PI - (i / segments) * Math.PI;
    pts.push([Math.cos(a) * r, top + Math.sin(a) * r, 0]);
  }
  pts.push([r, -inset, 0]);
  return pts;
}

// A real product photo as an arch-framed plane standing on its base (origin
// at the bottom centre), with a thin gold outline.
export function ArchImage({
  src,
  width,
  height,
  hover,
  animate,
  textureWidth = 750,
}: {
  src: string;
  width: number;
  height: number;
  // 0..1, eased by the parent.
  hover: React.MutableRefObject<number>;
  animate: boolean;
  textureWidth?: number;
}) {
  const texture = useTexture(optimizedImageUrl(src, textureWidth));

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);

  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uPlane: { value: new THREE.Vector2(width, height) },
      uImageAspect: { value: 1 },
      uHover: { value: 0 },
      uSweep: { value: -1 },
      uOpacity: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const img = texture.image as { width?: number; height?: number } | undefined;
    uniforms.uMap.value = texture;
    uniforms.uImageAspect.value = img?.width && img?.height ? img.width / img.height : 0.75;
    uniforms.uPlane.value.set(width, height);
  }, [texture, width, height, uniforms]);

  useFrame(({ clock }) => {
    uniforms.uHover.value = hover.current;
    // One slow pass of light every ~9s.
    uniforms.uSweep.value = animate ? ((clock.elapsedTime * 0.16) % 1.45) * 1.9 - 0.4 : -1;
  });

  const outline = useMemo(() => archOutline(width, height, 0.045), [width, height]);
  const backing = useMemo(() => archShape(width, height, 0.045), [width, height]);

  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>
      {/* ivory passe-partout + hairline gold edge */}
      <mesh position={[0, 0, -0.012]}>
        <shapeGeometry args={[backing]} />
        <meshBasicMaterial color={PALETTE.pearl} toneMapped={false} />
      </mesh>
      <Line points={outline} color={PALETTE.gold} lineWidth={1.1} transparent opacity={0.85} position={[0, 0, 0.002]} />
    </group>
  );
}

export function archShape(width: number, height: number, inset = 0) {
  const r = width / 2 + inset;
  const top = height - width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-r, -inset);
  shape.lineTo(-r, top);
  shape.absarc(0, top, r, Math.PI, 0, true);
  shape.lineTo(r, -inset);
  shape.lineTo(-r, -inset);
  return shape;
}
