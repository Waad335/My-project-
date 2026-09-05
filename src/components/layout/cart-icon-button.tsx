"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useEffect, useState } from "react";

export function CartIconButton() {
  const openDrawer = useCartStore((s) => s.openDrawer);
  const count = useCartStore((s) => s.count());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="Open cart"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-mocha-700 transition hover:bg-mocha-700/5"
    >
      <ShoppingBag size={20} />
      {mounted && count > 0 && (
        <span className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blush-400 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
