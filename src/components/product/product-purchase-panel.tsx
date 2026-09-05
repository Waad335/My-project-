"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import type { ProductDetailData } from "@/lib/serialize";
import { PriceTag } from "@/components/ui/price-tag";
import { useCartStore } from "@/store/cart-store";
import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";

export function ProductPurchasePanel({ product }: { product: ProductDetailData }) {
  const locale = useLocale();
  const t = useTranslations("product");
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const push = useToastStore((s) => s.push);

  const hasVariants = product.variants.length > 0;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasVariants ? (product.variants.find((v) => v.isDefault)?.id ?? product.variants[0]!.id) : null
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null;
  const unitPrice = product.effectivePrice + (selectedVariant?.priceDelta ?? 0);
  const stock = selectedVariant ? selectedVariant.stock : product.stock;
  const outOfStock = product.availability === "OUT_OF_STOCK" || stock === 0;

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
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-gold-500">
          {locale === "ar" ? product.categoryNameAr : product.categoryNameEn}
        </p>
        <h1 className="font-heading text-2xl text-mocha-700 sm:text-3xl">{name}</h1>
        <p className="mt-1 text-xs text-mocha-400">
          {t("sku")}: {selectedVariant?.sku ?? product.sku}
        </p>
      </div>

      <PriceTag price={unitPrice} oldPrice={product.oldPrice} size="lg" />

      <p
        className={cn(
          "w-fit rounded-full px-3 py-1 text-xs font-medium",
          outOfStock
            ? "bg-red-50 text-red-500"
            : stock < 10
              ? "bg-gold-100 text-gold-600"
              : "bg-green-50 text-green-600"
        )}
      >
        {outOfStock ? t("outOfStock") : stock < 10 ? t("lowStock") : t("inStock")}
      </p>

      {colorVariants.length > 0 && (
        <div>
          <p className="label-field">{t("color")}</p>
          <div className="flex flex-wrap gap-2">
            {colorVariants.map((v) => (
              <button
                key={v.id}
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
          <div className="flex flex-wrap gap-2">
            {sizeVariants.map((v) => (
              <button
                key={v.id}
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

      <div>
        <p className="label-field">{t("quantity")}</p>
        <div className="flex w-fit items-center gap-3 rounded-full border border-mocha-700/15 px-2 py-1.5">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-mocha-700/5"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(stock || 99, q + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-mocha-700/5"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={handleAddToCart} disabled={outOfStock} className="btn-secondary flex-1">
          <ShoppingBag size={16} />
          {t("addToCart")}
        </button>
        <button onClick={handleBuyNow} disabled={outOfStock} className="btn-primary flex-1">
          <Zap size={16} />
          {t("buyNow")}
        </button>
      </div>
    </div>
  );
}
