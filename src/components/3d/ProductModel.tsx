"use client";

import { PerfumeModel } from "@/components/3d/PerfumeModel";
import { CosmeticModel } from "@/components/3d/CosmeticModel";
import { HandbagModel } from "@/components/3d/HandbagModel";
import { JewelryModel } from "@/components/3d/JewelryModel";
import type { SceneQuality } from "@/components/3d/materials";
import type { ModelKind } from "@/components/3d/model-kind";

export function ProductModel({ kind, quality }: { kind: ModelKind; quality: SceneQuality }) {
  switch (kind) {
    case "perfume":
      return <PerfumeModel quality={quality} variant="classic" />;
    case "flacon":
      return <PerfumeModel quality={quality} variant="flacon" />;
    case "serum":
      return <CosmeticModel quality={quality} variant="serum" />;
    case "jar":
      return <CosmeticModel quality={quality} variant="jar" />;
    case "pump":
      return <CosmeticModel quality={quality} variant="pump" />;
    case "lipstick":
      return <CosmeticModel quality={quality} variant="lipstick" />;
    case "handbag":
      return <HandbagModel />;
    case "ring":
      return <JewelryModel quality={quality} variant="ring" />;
    case "necklace":
      return <JewelryModel quality={quality} variant="necklace" />;
  }
}
