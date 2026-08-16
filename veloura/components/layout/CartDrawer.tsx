"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import Link from "next/link";
import { useCartStore, useUiStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { ProductMedia } from "@/components/ui/ProductMedia";
import { Button } from "@/components/ui/Button";
import { CartLinesSkeleton } from "@/components/ui/Skeleton";
import { DURATION, EASE_LUXURY } from "@/lib/motion";

export function CartDrawer() {
  const { isCartOpen, closeCart } = useUiStore();
  const { cart, isHydrated, updateItem, removeItem, isLoading } = useCartStore();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCart]);

  const lines = cart?.lines ?? [];
  const isEmpty = lines.length === 0;
  const checkoutReady = Boolean(cart && cart.checkoutUrl !== "#shopify-not-configured");

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : DURATION.fast }}
            onClick={closeCart}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px]"
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: prefersReducedMotion ? 0 : DURATION.base, ease: EASE_LUXURY }}
            className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-6">
              <h2 className="font-serif-display text-2xl">Your Bag</h2>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="relative flex h-6 w-6 items-center justify-center"
              >
                <span className="absolute h-px w-5 rotate-45 bg-current" />
                <span className="absolute h-px w-5 -rotate-45 bg-current" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {!isHydrated ? (
                <CartLinesSkeleton />
              ) : isEmpty ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <p className="text-sm text-muted">Your bag is empty.</p>
                  <Button href="/shop" size="sm" onClick={closeCart}>
                    Explore the shop
                  </Button>
                </div>
              ) : (
                <ul className="flex flex-col gap-6">
                  {lines.map((line) => (
                    <li key={line.id} className="flex gap-4">
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-beige">
                        <ProductMedia
                          src={line.merchandise.image?.url}
                          alt={line.merchandise.product.title}
                          seed={line.merchandise.product.handle}
                          className="h-full w-full"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <Link
                            href={`/products/${line.merchandise.product.handle}`}
                            onClick={closeCart}
                            className="font-serif-display text-base leading-tight hover:text-gold-deep"
                          >
                            {line.merchandise.product.title}
                          </Link>
                          <p className="mt-1 text-xs text-muted">
                            {formatPrice(
                              line.cost.totalAmount.amount,
                              line.cost.totalAmount.currencyCode
                            )}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-black/15">
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => updateItem(line.id, line.quantity - 1).catch(console.error)}
                              aria-label="Decrease quantity"
                              className="px-2.5 py-1 text-sm hover:bg-black/5 disabled:opacity-40"
                            >
                              −
                            </button>
                            <span className="min-w-[2ch] text-center text-sm">{line.quantity}</span>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => updateItem(line.id, line.quantity + 1).catch(console.error)}
                              aria-label="Increase quantity"
                              className="px-2.5 py-1 text-sm hover:bg-black/5 disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => removeItem(line.id).catch(console.error)}
                            className="text-xs uppercase tracking-wide text-muted hover:text-black disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!isEmpty && cart && (
              <div className="border-t border-black/10 px-6 py-6">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="uppercase tracking-[0.14em] text-muted">Subtotal</span>
                  <span className="font-serif-display text-lg">
                    {formatPrice(cart.cost.subtotalAmount.amount, cart.cost.subtotalAmount.currencyCode)}
                  </span>
                </div>
                <p className="mb-4 text-[11px] text-muted">
                  {checkoutReady
                    ? "Taxes and instant download delivery calculated at checkout."
                    : "Checkout requires a connected Shopify store. See the README to connect one."}
                </p>
                {checkoutReady ? (
                  <Button href={cart.checkoutUrl} className="w-full">
                    Checkout
                  </Button>
                ) : (
                  <Button type="button" disabled className="w-full">
                    Checkout Unavailable
                  </Button>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
