"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import type { ProductDetailData } from "@/lib/serialize";
import { PriceTag } from "@/components/ui/price-tag";
import { RatingStars } from "@/components/ui/rating-stars";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";
import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";

export function ProductPurchasePanel({ product }: { product: ProductDetailData }) {
  const locale = useLocale();
  const t = useTranslations("product");
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const push = useToastStore((s) => s.push);
  const wishlisted = useWishlistStore((s) => s.has(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const hasVariants = product.variants.length > 0;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasVariants ? (product.variants.find((v) => v.isDefault)?.id ?? product.variants[0]!.id) : null
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null;
  const unitPrice = product.effectivePrice + (selectedVariant?.priceDelta ?? 0);
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  // Variants are always stock-tracked; a base product can opt out via trackStock
  // (made-to-order items with no fixed inventory) so it's always available with
  // no quantity ever shown.
  const stockTracked = selectedVariant ? true : product.trackStock;
  const outOfStock = stockTracked && (product.availability === "OUT_OF_STOCK" || stock === 0);

  const colorVariants = useMemo(
    () => product.variants.filter((v) => v.color && !v.size),
    [product.variants]
  );
  const sizeVariants = useMemo(() => product.variants.filter((v) => v.size), [product.variants]);
  const name = locale === "ar" ? product.nameAr : product.nameEn;

  function buildCartItem() {
    return {
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      slug: product.slug,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      image: product.image,
      unitPrice,
      quantity,
      variantLabel: selectedVariant ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ") : null,
      maxStock: stock,
    };
  }

  function handleAddToCart() {
    if (outOfStock) return;
    addItem(buildCartItem());
    push(t("addedToCart"), "success");
  }

  function handleBuyNow() {
    if (outOfStock) return;
    addItem(buildCartItem());
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-28">
      <div className="flex flex-col gap-3">
        <p className="eyebrow">{locale === "ar" ? product.categoryNameAr : product.categoryNameEn}</p>
        <h1 className="text-balance font-heading text-[2rem] leading-tight text-mocha-700 sm:text-[2.5rem] rtl:leading-snug">{name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {product.ratingCount > 0 ? (
            <a href="#product-details" className="flex items-center gap-2 text-mocha-600 hover:text-mocha-800">
              <RatingStars rating={product.ratingAvg} size={14} />
              <span>
                {product.ratingAvg.toFixed(1)} · {t("reviewsCount", { count: product.ratingCount })}
              </span>
            </a>
          ) : (
            <span className="text-mocha-400">{t("noReviewsYet")}</span>
          )}
          <span className="text-xs text-mocha-400">
            {t("sku")}: {selectedVariant?.sku ?? product.sku}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-y border-mocha-700/8 py-5">
        <PriceTag price={unitPrice} oldPrice={product.oldPrice} size="lg" />
        <span
          className={cn(
            "ms-auto rounded-full px-3 py-1 text-xs font-medium",
            outOfStock
              ? "bg-blush-50 text-blush-600"
              : stockTracked && stock < 10
                ? "bg-gold-50 text-gold-600"
                : "bg-sand-100 text-mocha-600"
          )}
        >
          {outOfStock ? t("outOfStock") : stockTracked && stock < 10 ? t("lowStockCount", { count: stock }) : t("inStock")}
        </span>
      </div>

      {colorVariants.length > 0 && (
        <div>
          <p className="label-field">
            {t("color")}
            {selectedVariant?.color && <span className="ms-2 font-normal text-mocha-500">{selectedVariant.color}</span>}
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("color")}>
            {colorVariants.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={selectedVariantId === v.id}
                onClick={() => setSelectedVariantId(v.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  selectedVariantId === v.id
                    ? "border-mocha-700 bg-mocha-700 text-ivory"
                    : "border-mocha-700/15 text-mocha-600 hover:border-mocha-700/40"
                )}
              >
                {v.colorHex && (
                  <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: v.colorHex }} />
                )}
                {v.color}
              </button>
            ))}
          </div>
        </div>
      )}

      {sizeVariants.length > 0 && (
        <div>
          <p className="label-field">{t("size")}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("size")}>
            {sizeVariants.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={selectedVariantId === v.id}
                onClick={() => setSelectedVariantId(v.id)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium transition",
                  selectedVariantId === v.id
                    ? "border-mocha-700 bg-mocha-700 text-ivory"
                    : "border-mocha-700/15 text-mocha-600 hover:border-mocha-700/40"
                )}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="label-field" id="quantity-label">
          {t("quantity")}
        </p>
        <div className="flex flex-wrap items-stretch gap-3">
          <div className="flex items-center rounded-full border border-mocha-700/15" role="group" aria-labelledby="quantity-label">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-mocha-700/5 disabled:opacity-35"
              aria-label={t("decreaseQuantity")}
            >
              <Minus size={15} />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(stockTracked ? stock || 1 : 99, q + 1))}
              disabled={stockTracked ? quantity >= stock : quantity >= 99}
              className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-mocha-700/5 disabled:opacity-35"
              aria-label={t("increaseQuantity")}
            >
              <Plus size={15} />
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              toggleWishlist({
                productId: product.id,
                slug: product.slug,
                nameEn: product.nameEn,
                nameAr: product.nameAr,
                image: product.image,
                price: product.effectivePrice,
              })
            }
            aria-pressed={wishlisted}
            aria-label={wishlisted ? t("removeFromWishlist") : t("addToWishlist")}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full border transition-colors",
              wishlisted ? "border-blush-300 bg-blush-50 text-blush-500" : "border-mocha-700/15 text-mocha-600 hover:border-mocha-700"
            )}
          >
            <Heart size={17} fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={handleAddToCart} disabled={outOfStock} className="btn-secondary flex-1 py-4 tracking-[0.12em] rtl:tracking-normal">
          <ShoppingBag size={16} aria-hidden="true" />
          {t("addToCart")}
        </button>
        <button type="button" onClick={handleBuyNow} disabled={outOfStock} className="btn-primary flex-1 py-4 tracking-[0.12em] rtl:tracking-normal">
          {t("buyNow")}
        </button>
      </div>
    </div>
  );
}
