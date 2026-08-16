import "server-only";
import { isShopifyConfigured, shopifyFetch, ShopifyApiError } from "./client";
import {
  ADD_TO_CART_MUTATION,
  CREATE_CART_MUTATION,
  GET_CART_QUERY,
  REMOVE_FROM_CART_MUTATION,
  UPDATE_CART_MUTATION,
} from "./mutations";
import { transformCart } from "./transforms";
import { mockProducts } from "./mock-data";
import type { ShopifyCart } from "@/types/shopify";

interface CartUserError {
  field: string[] | null;
  message: string;
}

/**
 * Shopify's cart mutations can return HTTP 200 with the (unchanged) cart
 * plus a non-empty `userErrors` array — e.g. insufficient inventory or an
 * invalid merchandise id. Left unchecked, that reads as a silent success.
 */
function assertNoUserErrors(userErrors: CartUserError[] | undefined, action: string): void {
  if (userErrors && userErrors.length > 0) {
    throw new ShopifyApiError(
      `Shopify rejected ${action}: ${userErrors.map((e) => e.message).join(" ")}`,
      userErrors
    );
  }
}

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
}

export interface CartLineUpdateInput {
  id: string;
  quantity: number;
}

/**
 * In-memory demo cart, used only when Shopify credentials are not configured.
 * Lives for the lifetime of the server process — enough to demo the drawer/UX
 * locally. Real persistence and checkout require a connected Shopify store.
 */
const mockCarts = new Map<string, ShopifyCart>();

function emptyMockCart(id: string): ShopifyCart {
  return {
    id,
    checkoutUrl: "#shopify-not-configured",
    totalQuantity: 0,
    cost: {
      subtotalAmount: { amount: "0.00", currencyCode: "USD" },
      totalAmount: { amount: "0.00", currencyCode: "USD" },
      totalTaxAmount: null,
    },
    lines: [],
  };
}

function recalculateMockCart(cart: ShopifyCart): ShopifyCart {
  const totalQuantity = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalAmount = cart.lines.reduce(
    (sum, line) => sum + Number(line.cost.totalAmount.amount),
    0
  );
  return {
    ...cart,
    totalQuantity,
    cost: {
      ...cart.cost,
      subtotalAmount: { amount: totalAmount.toFixed(2), currencyCode: "USD" },
      totalAmount: { amount: totalAmount.toFixed(2), currencyCode: "USD" },
    },
  };
}

function mockAddLines(cart: ShopifyCart, lines: CartLineInput[]): ShopifyCart {
  const next = { ...cart, lines: [...cart.lines] };
  for (const line of lines) {
    const product = mockProducts.find((p) => p.variants.some((v) => v.id === line.merchandiseId));
    const variant = product?.variants.find((v) => v.id === line.merchandiseId);
    if (!product || !variant) continue;

    const existing = next.lines.find((l) => l.merchandise.id === line.merchandiseId);
    if (existing) {
      existing.quantity += line.quantity;
      existing.cost.totalAmount = {
        amount: (Number(variant.price.amount) * existing.quantity).toFixed(2),
        currencyCode: variant.price.currencyCode,
      };
    } else {
      next.lines.push({
        id: `mock-line-${line.merchandiseId}-${Date.now()}`,
        quantity: line.quantity,
        cost: {
          totalAmount: {
            amount: (Number(variant.price.amount) * line.quantity).toFixed(2),
            currencyCode: variant.price.currencyCode,
          },
        },
        merchandise: {
          id: variant.id,
          title: variant.title,
          selectedOptions: variant.selectedOptions,
          image: variant.image ?? product.featuredImage,
          product: { handle: product.handle, title: product.title },
        },
      });
    }
  }
  return recalculateMockCart(next);
}

export async function createCart(lines: CartLineInput[] = []): Promise<ShopifyCart> {
  if (!isShopifyConfigured) {
    const id = `mock-cart-${Math.random().toString(36).slice(2)}`;
    const cart = mockAddLines(emptyMockCart(id), lines);
    mockCarts.set(id, cart);
    return cart;
  }

  const { data } = await shopifyFetch<{
    cartCreate: { cart: unknown; userErrors: CartUserError[] };
  }>({
    query: CREATE_CART_MUTATION,
    variables: { lines },
    cache: "no-store",
  });

  assertNoUserErrors(data?.cartCreate.userErrors, "cart creation");
  if (!data?.cartCreate.cart) throw new Error("Failed to create cart");
  return transformCart(data.cartCreate.cart as never);
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  if (!isShopifyConfigured) {
    return mockCarts.get(cartId) ?? null;
  }

  const { data } = await shopifyFetch<{ cart: unknown | null }>({
    query: GET_CART_QUERY,
    variables: { cartId },
    cache: "no-store",
  });

  if (!data?.cart) return null;
  return transformCart(data.cart as never);
}

export async function addToCart(cartId: string, lines: CartLineInput[]): Promise<ShopifyCart> {
  if (!isShopifyConfigured) {
    const cart = mockCarts.get(cartId) ?? emptyMockCart(cartId);
    const updated = mockAddLines(cart, lines);
    mockCarts.set(cartId, updated);
    return updated;
  }

  const { data } = await shopifyFetch<{
    cartLinesAdd: { cart: unknown; userErrors: CartUserError[] };
  }>({
    query: ADD_TO_CART_MUTATION,
    variables: { cartId, lines },
    cache: "no-store",
  });

  assertNoUserErrors(data?.cartLinesAdd.userErrors, "adding to cart");
  if (!data?.cartLinesAdd.cart) throw new Error("Failed to add line to cart");
  return transformCart(data.cartLinesAdd.cart as never);
}

export async function updateCart(
  cartId: string,
  lines: CartLineUpdateInput[]
): Promise<ShopifyCart> {
  if (!isShopifyConfigured) {
    const cart = mockCarts.get(cartId) ?? emptyMockCart(cartId);
    const next = { ...cart, lines: [...cart.lines] };
    for (const update of lines) {
      const line = next.lines.find((l) => l.id === update.id);
      if (!line) continue;
      const unitPrice = Number(line.cost.totalAmount.amount) / line.quantity;
      line.quantity = update.quantity;
      line.cost.totalAmount = {
        amount: (unitPrice * update.quantity).toFixed(2),
        currencyCode: line.cost.totalAmount.currencyCode,
      };
    }
    const recalculated = recalculateMockCart(next);
    mockCarts.set(cartId, recalculated);
    return recalculated;
  }

  const { data } = await shopifyFetch<{
    cartLinesUpdate: { cart: unknown; userErrors: CartUserError[] };
  }>({
    query: UPDATE_CART_MUTATION,
    variables: { cartId, lines },
    cache: "no-store",
  });

  assertNoUserErrors(data?.cartLinesUpdate.userErrors, "updating cart line");
  if (!data?.cartLinesUpdate.cart) throw new Error("Failed to update cart line");
  return transformCart(data.cartLinesUpdate.cart as never);
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<ShopifyCart> {
  if (!isShopifyConfigured) {
    const cart = mockCarts.get(cartId) ?? emptyMockCart(cartId);
    const next = recalculateMockCart({
      ...cart,
      lines: cart.lines.filter((l) => !lineIds.includes(l.id)),
    });
    mockCarts.set(cartId, next);
    return next;
  }

  const { data } = await shopifyFetch<{
    cartLinesRemove: { cart: unknown; userErrors: CartUserError[] };
  }>({
    query: REMOVE_FROM_CART_MUTATION,
    variables: { cartId, lineIds },
    cache: "no-store",
  });

  assertNoUserErrors(data?.cartLinesRemove.userErrors, "removing cart line");
  if (!data?.cartLinesRemove.cart) throw new Error("Failed to remove cart line");
  return transformCart(data.cartLinesRemove.cart as never);
}
