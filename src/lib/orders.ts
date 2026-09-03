import { prisma } from "@/lib/prisma";
import { generateOrderNumber, toNumber } from "@/lib/utils";
import { getShippingQuote } from "@/lib/shipping";
import type { CheckoutInput } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

export class OrderCreationError extends Error {}

/**
 * Builds and persists an order from validated checkout input. All pricing
 * (product prices, discounts, shipping fee) is re-derived server-side from
 * the database — the client only supplies product/variant ids and
 * quantities, so nothing about the total can be tampered with in the browser.
 */
export async function createOrderFromCheckout(input: CheckoutInput) {
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const lineItems: {
    productId: string;
    variantId: string | null;
    nameEnSnapshot: string;
    nameArSnapshot: string;
    skuSnapshot: string;
    imageSnapshot: string | null;
    variantLabel: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[] = [];

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive) {
      throw new OrderCreationError(`Product no longer available: ${item.productId}`);
    }

    let unitPrice = toNumber(product.salePrice ?? product.price);
    let variantLabel: string | null = null;
    let skuSnapshot = product.sku;
    let availableStock = product.stock;

    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) throw new OrderCreationError(`Variant not found for ${product.nameEn}`);
      unitPrice += toNumber(variant.priceDelta);
      variantLabel = [variant.color, variant.size].filter(Boolean).join(" / ") || null;
      skuSnapshot = variant.sku;
      availableStock = variant.stock;
    }

    if (product.availability === "OUT_OF_STOCK" || availableStock < item.quantity) {
      throw new OrderCreationError(`${product.nameEn} is out of stock.`);
    }

    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    lineItems.push({
      productId: product.id,
      variantId: item.variantId ?? null,
      nameEnSnapshot: product.nameEn,
      nameArSnapshot: product.nameAr,
      skuSnapshot,
      imageSnapshot: product.images[0]?.url ?? null,
      variantLabel,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    });
  }

  const shippingQuote = await getShippingQuote(input.governorate, subtotal);

  let discountAmount = 0;
  let promoCodeId: string | null = null;
  if (input.promoCode) {
    const promo = await prisma.promoCode.findUnique({ where: { code: input.promoCode.toUpperCase() } });
    if (promo && promo.isActive) {
      const now = new Date();
      const withinWindow =
        (!promo.startsAt || promo.startsAt <= now) && (!promo.expiresAt || promo.expiresAt >= now);
      const withinUsage = !promo.usageLimit || promo.usedCount < promo.usageLimit;
      const meetsMinimum = !promo.minOrderValue || subtotal >= toNumber(promo.minOrderValue);

      if (withinWindow && withinUsage && meetsMinimum) {
        discountAmount =
          promo.type === "PERCENT" ? subtotal * (toNumber(promo.value) / 100) : toNumber(promo.value);
        if (promo.maxDiscount) discountAmount = Math.min(discountAmount, toNumber(promo.maxDiscount));
        discountAmount = Math.min(discountAmount, subtotal);
        promoCodeId = promo.id;
      }
    }
  }

  const total = Math.max(subtotal - discountAmount + shippingQuote.fee, 0);

  const customer = await prisma.customer.create({
    data: {
      name: input.name,
      phone: input.phone,
      whatsapp: input.whatsapp || input.phone,
      email: input.email || null,
      governorate: input.governorate,
      city: input.city,
      address: input.address,
      buildingInfo: input.buildingInfo || null,
      notes: input.notes || null,
    },
  });

  const orderNumber = await uniqueOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentProvider: input.paymentMethod,
        subtotal,
        discountAmount,
        shippingFee: shippingQuote.fee,
        total,
        promoCodeId,
        shippingGovernorate: input.governorate,
        shippingCity: input.city,
        shippingAddress: input.address,
        shippingBuildingInfo: input.buildingInfo || null,
        shippingMethodLabel: shippingQuote.isCairo ? shippingQuote.etaEn : shippingQuote.etaEn,
        isCairoDelivery: shippingQuote.isCairo,
        customerNotes: input.notes || null,
        items: { create: lineItems as unknown as Prisma.OrderItemCreateWithoutOrderInput[] },
      },
      include: { items: true },
    });

    for (const item of input.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    if (promoCodeId) {
      await tx.promoCode.update({ where: { id: promoCodeId }, data: { usedCount: { increment: 1 } } });
    }

    return created;
  });

  return order;
}

async function uniqueOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateOrderNumber();
    const existing = await prisma.order.findUnique({ where: { orderNumber: candidate } });
    if (!existing) return candidate;
  }
  throw new OrderCreationError("Could not generate a unique order number, please retry.");
}
