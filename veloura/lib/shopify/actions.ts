"use server";

import { cookies } from "next/headers";
import * as cartService from "./cart";
import type { ShopifyCart } from "@/types/shopify";

const CART_COOKIE = "veloura_cart_id";

async function resolveCartId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

async function persistCartId(cartId: string) {
  const store = await cookies();
  store.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Returns the current visitor's cart, or null if none exists yet. */
export async function getCartAction(): Promise<ShopifyCart | null> {
  const cartId = await resolveCartId();
  if (!cartId) return null;
  return cartService.getCart(cartId);
}

/** Adds a variant to the cart, creating the cart (and cookie) on first use. */
export async function addToCartAction(
  merchandiseId: string,
  quantity: number = 1
): Promise<ShopifyCart> {
  const cartId = await resolveCartId();

  if (!cartId) {
    const cart = await cartService.createCart([{ merchandiseId, quantity }]);
    await persistCartId(cart.id);
    return cart;
  }

  const existing = await cartService.getCart(cartId);
  if (!existing) {
    const cart = await cartService.createCart([{ merchandiseId, quantity }]);
    await persistCartId(cart.id);
    return cart;
  }

  return cartService.addToCart(cartId, [{ merchandiseId, quantity }]);
}

export async function updateCartLineAction(lineId: string, quantity: number): Promise<ShopifyCart> {
  const cartId = await resolveCartId();
  if (!cartId) throw new Error("No active cart");

  if (quantity <= 0) {
    return cartService.removeFromCart(cartId, [lineId]);
  }
  return cartService.updateCart(cartId, [{ id: lineId, quantity }]);
}

export async function removeCartLineAction(lineId: string): Promise<ShopifyCart> {
  const cartId = await resolveCartId();
  if (!cartId) throw new Error("No active cart");
  return cartService.removeFromCart(cartId, [lineId]);
}
