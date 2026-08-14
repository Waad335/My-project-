"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import type { ShopifyProductVariant } from "@/types/shopify";

export function AddToCart({ variant }: { variant: ShopifyProductVariant | undefined }) {
  const { addItem } = useCartStore();
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "error">("idle");

  if (!variant) {
    return (
      <Button disabled variant="secondary" className="w-full">
        Unavailable
      </Button>
    );
  }

  if (!variant.availableForSale) {
    return (
      <Button disabled variant="secondary" className="w-full">
        Sold Out
      </Button>
    );
  }

  async function handleAdd() {
    if (!variant) return;
    setStatus("loading");
    try {
      await addItem(variant.id, 1);
      setStatus("added");
    } catch (error) {
      console.error("[cart] Failed to add item", error);
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 1800);
    }
  }

  return (
    <Button onClick={handleAdd} disabled={status === "loading"} className="w-full">
      {status === "loading"
        ? "Adding…"
        : status === "added"
          ? "Added to Bag ✓"
          : status === "error"
            ? "Couldn't Add — Try Again"
            : "Add to Bag"}
    </Button>
  );
}
