"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist-store";

export function WishlistIconButton() {
  const count = useWishlistStore((s) => s.count());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Link
      href="/wishlist"
      aria-label="Open wishlist"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-mocha-700 transition hover:bg-mocha-700/5"
    >
      <Heart size={20} />
      {mounted && count > 0 && (
        <span className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blush-400 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
