"use client";

import { useEffect, useState } from "react";
import type { SceneQuality } from "@/components/3d/materials";

export type SceneLayout = "wide" | "compact";

type Capability = {
  // null until checked on the client (the server can't know).
  webgl: boolean | null;
  quality: SceneQuality;
  layout: SceneLayout;
};

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

// Decides whether to mount WebGL at all, and how much to render: phones and
// low-power devices get fewer objects, no transmission and lower DPR.
// `wideOnly`: callers that never use WebGL on phones/tablets skip the probe
// there entirely (creating a GL context isn't free on mobile).
export function use3DCapability({ wideOnly = false }: { wideOnly?: boolean } = {}): Capability {
  const [cap, setCap] = useState<Capability>({ webgl: null, quality: "low", layout: "wide" });

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 1023px)");
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

    const evaluate = () => {
      const phone = window.matchMedia("(max-width: 767px)").matches;
      const weak =
        (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || Boolean(nav.connection?.saveData);
      setCap({
        webgl: wideOnly && compact.matches ? false : detectWebGL(),
        quality: phone || weak ? "low" : "high",
        layout: compact.matches ? "compact" : "wide",
      });
    };

    evaluate();
    compact.addEventListener("change", evaluate);
    return () => compact.removeEventListener("change", evaluate);
  }, [wideOnly]);

  return cap;
}
