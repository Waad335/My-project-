"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Heart, ShoppingBag } from "lucide-react";
import type { ProductCardData } from "@/lib/serialize";
import { PriceTag } from "@/components/ui/price-tag";
import { RatingStars } from "@/components/ui/rating-stars";
import { DodanaImage } from "@/components/ui/dodana-image";
import { useCartStore } from "@/store/cart-store";
import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: ProductCardData }) {
  const locale = useLocale();
  const t = useTranslations("product");
  const addItem = useCartStore((s) => s.addItem);
  const push = useToastStore((s) => s.push);

  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const outOfStock = product.availability === "OUT_OF_STOCK" || product.stock === 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem({
      productId: product.id,
      variantId: null,
      slug: product.slug,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      image: product.image,
      unitPrice: product.effectivePrice,
      quantity: 1,
      variantLabel: null,
      maxStock: product.stock,
    });
    push(t("addedToCart"), "success");
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-card border border-mocha-700/5 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ivory-200">
        <DodanaImage
          src={product.image}
          alt={(locale === "ar" ? product.imageAltAr : product.imageAltEn) || name}
          fill
          showWordmark
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute start-2 top-2 flex flex-col gap-1.5">
          {product.isNewArrival && <span className="badge-new">{t("new")}</span>}
          {product.isBestSeller && <span className="badge-best">{t("bestSeller")}</span>}
          {product.oldPrice && product.oldPrice > product.effectivePrice && (
            <span className="badge-sale">{t("sale")}</span>
          )}
        </div>

        <button
          type="button"
          aria-label="Wishlist"
          className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-mocha-500 opacity-0 shadow-soft transition-opacity duration-200 group-hover:opacity-100"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={15} />
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className={cn(
            "absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold shadow-soft transition-all duration-200 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100",
            outOfStock ? "cursor-not-allowed bg-mocha-100 text-mocha-400" : "bg-mocha-700 text-ivory hover:bg-mocha-800"
          )}
        >
          <ShoppingBag size={14} />
          {outOfStock ? t("outOfStock") : t("addToCart")}
        </button>
      </div>

      <div className="p-3.5">
        <p className="mb-1 truncate text-[11px] uppercase tracking-wide text-gold-500">
          {locale === "ar" ? product.categoryNameAr : product.categoryNameEn}
        </p>
        <h3 className="mb-1.5 line-clamp-2 min-h-[2.5rem] font-heading text-sm font-medium text-mocha-700">
          {name}
        </h3>
        {product.ratingCount > 0 && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <RatingStars rating={product.ratingAvg} size={12} />
            <span className="text-[11px] text-mocha-400">({product.ratingCount})</span>
          </div>
        )}
        <PriceTag price={product.effectivePrice} oldPrice={product.oldPrice} size="sm" />
      </div>
    </Link>
  );
}
