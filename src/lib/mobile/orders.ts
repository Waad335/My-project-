import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { absoluteUrl } from "@/lib/mobile/dto";
import type { OrderDetail, OrderItem, OrderSummary } from "@/lib/mobile/types";

// A signed-in customer's own orders. Every query is scoped by userId, so an
// order number belonging to someone else is simply "not found". Staff-only
// fields (internal notes, payment references) are never included.

const itemsInclude = { items: { include: { product: { select: { slug: true } } } } } as const;
type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof itemsInclude }>;

function toItem(item: OrderWithItems["items"][number]): OrderItem {
  return {
    productId: item.productId,
    productSlug: item.product?.slug ?? null,
    nameEn: item.nameEnSnapshot,
    nameAr: item.nameArSnapshot,
    sku: item.skuSnapshot,
    image: absoluteUrl(item.imageSnapshot),
    variantLabel: item.variantLabel,
    unitPrice: toNumber(item.unitPrice),
    quantity: item.quantity,
    lineTotal: toNumber(item.lineTotal),
  };
}

function toSummary(order: OrderWithItems): OrderSummary {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentProvider,
    total: toNumber(order.total),
    itemCount: order.items.reduce((n, i) => n + i.quantity, 0),
    items: order.items.map(toItem),
  };
}

// Newest first; the same 50-order window as the website's account page.
export async function listCustomerOrders(userId: string): Promise<OrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: itemsInclude,
  });
  return orders.map(toSummary);
}

export async function getCustomerOrder(userId: string, orderNumber: string): Promise<OrderDetail | null> {
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId },
    include: { ...itemsInclude, customer: true },
  });
  if (!order) return null;
  return {
    ...toSummary(order),
    subtotal: toNumber(order.subtotal),
    discountAmount: toNumber(order.discountAmount),
    shippingFee: toNumber(order.shippingFee),
    delivery: {
      name: order.customer.name,
      phone: order.customer.phone,
      whatsapp: order.customer.whatsapp,
      email: order.customer.email,
      governorate: order.shippingGovernorate,
      city: order.shippingCity,
      address: order.shippingAddress,
      buildingInfo: order.shippingBuildingInfo,
      methodLabel: order.shippingMethodLabel,
      isCairo: order.isCairoDelivery,
    },
    customerNotes: order.customerNotes,
  };
}
