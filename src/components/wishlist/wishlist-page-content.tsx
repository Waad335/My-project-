"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Heart, X, ShoppingBag } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";
import { useToastStore } from "@/store/toast-store";
import { DodanaImage } from "@/components/ui/dodana-image";
import { formatEGP } from "@/lib/utils";
import { SparkleDivider } from "@/components/icons/decorative";

export function WishlistPageContent() {
  const locale = useLocale();
  const t = useTranslations("wishlist");
  const tProduct = useTranslations("product");
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.remove);
  const addToCart = useCartStore((s) => s.addItem);
  const push = useToastStore((s) => s.push);

  if (items.length === 0) {
    return (
      <div className="container-dodana flex flex-col items-center gap-4 py-24 text-center">
        <Heart size={48} className="text-mocha-300" />
        <h1 className="font-heading text-2xl text-mocha-700">{t("empty")}</h1>
        <p className="text-sm text-mocha-500">{t("emptyBody")}</p>
        <Link href="/" className="btn-primary mt-2">
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-dodana py-10">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl text-mocha-700">{t("title")}</h1>
        <SparkleDivider className="mt-4" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const name = locale === "ar" ? item.nameAr : item.nameEn;
          return (
            <div key={item.productId} className="group relative overflow-hidden rounded-card border border-mocha-700/5 bg-white shadow-soft">
              <button
                onClick={() => removeItem(item.productId)}
                aria-label={t("remove")}
                className="absolute end-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-mocha-500 shadow-soft transition hover:text-blush-500"
              >
                <X size={15} />
              </button>
              <Link href={`/product/${item.slug}`} className="block">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-ivory-200">
                  <DodanaImage src={item.image} alt={name} fill showWordmark sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                </div>
              </Link>
              <div className="p-3.5">
                <Link href={`/product/${item.slug}`} className="mb-1.5 line-clamp-2 block min-h-[2.5rem] font-heading text-sm font-medium text-mocha-700 hover:underline">
                  {name}
                </Link>
                <p className="mb-3 text-sm font-semibold text-mocha-700">{formatEGP(item.price, locale)}</p>
                <button
                  onClick={() => {
                    addToCart({
                      productId: item.productId,
                      variantId: null,
                      slug: item.slug,
                      nameEn: item.nameEn,
                      nameAr: item.nameAr,
                      image: item.image,
                      unitPrice: item.price,
                      quantity: 1,
                      variantLabel: null,
                      maxStock: 99,
                    });
                    push(tProduct("addedToCart"), "success");
                  }}
                  className="btn-primary w-full !py-2.5 text-xs"
                >
                  <ShoppingBag size={13} />
                  {tProduct("addToCart")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
