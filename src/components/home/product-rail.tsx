"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ProductCardData } from "@/lib/serialize";
import { ProductCard } from "@/components/product/product-card";

// Horizontal, scroll-snapping product showcase with prev/next controls and a
// hairline progress indicator. Native scrolling, so touch/trackpad/keyboard
// all work; the buttons are an enhancement.
export function ProductRail({ products, label }: { products: ProductCardData[]; label: string }) {
  const locale = useLocale();
  const t = useTranslations("home");
  const isRtl = locale === "ar";
  const track = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const { scrollXProgress } = useScroll({ container: track });
  const progress = useSpring(scrollXProgress, { stiffness: 140, damping: 30 });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    // scrollLeft is negative in RTL containers.
    const left = Math.abs(el.scrollLeft);
    setCanPrev(left > 8);
    setCanNext(left + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function scroll(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step * (isRtl ? -1 : 1), behavior: "smooth" });
  }

  return (
    <div>
      <ul
        ref={track}
        aria-label={label}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth scroll-px-4 px-4 pb-2 scrollbar-hide sm:-mx-6 sm:gap-5 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8"
      >
        {products.map((product) => (
          <li
            key={product.id}
            className="w-[70%] shrink-0 snap-start sm:w-[42%] md:w-[31%] lg:w-[calc(25%-15px)] xl:w-[calc(22%-15px)]"
          >
            <ProductCard product={product} sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 22vw" />
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center gap-6">
        <div className="relative h-px flex-1 overflow-hidden bg-mocha-700/10" aria-hidden="true">
          <motion.div
            style={{ scaleX: progress }}
            className="absolute inset-0 origin-left bg-mocha-700 rtl:origin-right"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!canPrev}
            aria-label={t("previous")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-mocha-700/20 text-mocha-700 transition-all duration-300 hover:border-mocha-700 hover:bg-mocha-700 hover:text-ivory disabled:pointer-events-none disabled:opacity-35"
          >
            <ArrowLeft size={17} aria-hidden="true" className="rtl:-scale-x-100" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canNext}
            aria-label={t("next")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-mocha-700/20 text-mocha-700 transition-all duration-300 hover:border-mocha-700 hover:bg-mocha-700 hover:text-ivory disabled:pointer-events-none disabled:opacity-35"
          >
            <ArrowRight size={17} aria-hidden="true" className="rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    </div>
  );
}
