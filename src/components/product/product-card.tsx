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
import { useWishlistStore } from "@/store/wishlist-store";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: ProductCardData;
  // Hint for next/image; override where the card is rendered wider/narrower.
  sizes?: string;
  priority?: boolean;
};

// Product tile. Structured as an <article> with sibling controls (not
// buttons nested inside a link) so screen readers and keyboards get one
// link to the product plus separate wishlist / add-to-cart buttons.
export function ProductCard({ product, sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw", priority }: ProductCardProps) {
  const locale = useLocale();
  const t = useTranslations("product");
  const addItem = useCartStore((s) => s.addItem);
  const push = useToastStore((s) => s.push);
  const wishlisted = useWishlistStore((s) => s.has(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const href = `/product/${product.slug}`;
  const outOfStock = product.trackStock && (product.availability === "OUT_OF_STOCK" || product.stock === 0);
  const isOnSale = Boolean(product.oldPrice && product.oldPrice > product.effectivePrice);
  const discount = isOnSale && product.oldPrice ? Math.round(((product.oldPrice - product.effectivePrice) / product.oldPrice) * 100) : 0;

  const badge = isOnSale
    ? { className: "badge-sale", label: `-${discount}%` }
    : product.isBestSeller
      ? { className: "badge-best", label: t("bestSeller") }
      : product.isNewArrival
        ? { className: "badge-new", label: t("new") }
        : null;

  function handleToggleWishlist() {
    toggleWishlist({
      productId: product.id,
      slug: product.slug,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      image: product.image,
      price: product.effectivePrice,
    });
  }

  function handleAddToCart() {
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
      maxStock: product.trackStock ? product.stock : 99,
    });
    push(t("addedToCart"), "success");
  }

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-sand-100">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          <DodanaImage
            src={product.image}
            alt=""
            fill
            showWordmark
            priority={priority}
            sizes={sizes}
            className={cn(
              "object-cover transition-all duration-700 ease-luxe can-hover:group-hover:scale-[1.04]",
              product.hoverImage && "can-hover:group-hover:opacity-0"
            )}
          />
          {product.hoverImage && (
            <DodanaImage
              src={product.hoverImage}
              alt=""
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-all duration-700 ease-luxe can-hover:group-hover:scale-[1.04] can-hover:group-hover:opacity-100"
            />
          )}
        </Link>

        {badge && (
          <span className={cn("pointer-events-none absolute start-3 top-3", badge.className)}>{badge.label}</span>
        )}

        <button
          type="button"
          aria-label={wishlisted ? t("removeFromWishlist") : t("addToWishlist")}
          aria-pressed={wishlisted}
          onClick={handleToggleWishlist}
          className={cn(
            "absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur transition-all duration-300 hover:text-blush-500 focus-visible:opacity-100",
            wishlisted ? "text-blush-500" : "text-mocha-600 can-hover:opacity-0 can-hover:group-hover:opacity-100"
          )}
        >
          <Heart size={16} fill={wishlisted ? "currentColor" : "none"} className={wishlisted ? "animate-heart-pop" : ""} />
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          aria-label={outOfStock ? t("outOfStock") : `${t("addToCart")} — ${name}`}
          className={cn(
            "absolute flex items-center justify-center gap-2 rounded-full text-xs font-semibold shadow-soft transition-all duration-500 ease-luxe focus-visible:translate-y-0 focus-visible:opacity-100",
            // Default (touch): a round icon button. Hover-capable pointers:
            // a full-width pill that slides up on hover/focus.
            "bottom-3 end-3 h-10 w-10",
            "can-hover:start-3 can-hover:h-auto can-hover:w-auto can-hover:py-3 can-hover:translate-y-3 can-hover:opacity-0 can-hover:group-hover:translate-y-0 can-hover:group-hover:opacity-100",
            outOfStock ? "cursor-not-allowed bg-white/90 text-mocha-400" : "bg-mocha-700 text-ivory hover:bg-mocha-800"
          )}
        >
          <ShoppingBag size={15} aria-hidden="true" />
          <span className="sr-only can-hover:not-sr-only">{outOfStock ? t("outOfStock") : t("addToCart")}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="mb-1.5 truncate text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gold-600 rtl:text-xs rtl:normal-case rtl:tracking-normal">
          {locale === "ar" ? product.categoryNameAr : product.categoryNameEn}
        </p>
        <h3 className="line-clamp-2 font-heading text-[15px] leading-snug text-mocha-700 sm:text-base">
          <Link href={href} className="transition-colors duration-300 hover:text-gold-600">
            {name}
          </Link>
        </h3>
        {product.ratingCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <RatingStars rating={product.ratingAvg} size={12} />
            <span className="text-[11px] text-mocha-400">({product.ratingCount})</span>
          </div>
        )}
        <div className="mt-2">
          <PriceTag price={product.effectivePrice} oldPrice={product.oldPrice} size="sm" showDiscount={false} />
        </div>
        {product.trackStock && !outOfStock && product.stock < 10 && (
          <p className="mt-1 text-[11px] font-medium text-gold-600">{t("lowStockCount", { count: product.stock })}</p>
        )}
      </div>
    </article>
  );
}
