import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation";
import { createOrderFromCheckout, OrderCreationError } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments";
import { getSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout data", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const settings = await getSiteSettings();
  if (parsed.data.paymentMethod === "COD" && !settings.codEnabled) {
    return NextResponse.json({ error: "Cash on Delivery is currently unavailable." }, { status: 400 });
  }
  if (parsed.data.paymentMethod === "PAYMOB" && !settings.onlinePaymentEnabled) {
    return NextResponse.json({ error: "Online payment is currently unavailable." }, { status: 400 });
  }

  try {
    const order = await createOrderFromCheckout(parsed.data);

    if (parsed.data.paymentMethod === "PAYMOB") {
      const provider = getPaymentProvider("PAYMOB");
      if (!provider.isConfigured) {
        return NextResponse.json(
          { error: "Online payment is not configured yet. Please choose Cash on Delivery." },
          { status: 503 }
        );
      }

      const customer = await prisma.customer.findUnique({ where: { id: order.customerId } });
      const result = await provider.initiate({
        orderNumber: order.orderNumber,
        amountEGP: toNumber(order.total),
        customer: { name: customer!.name, phone: customer!.phone, email: customer!.email },
      });

      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "PAYMOB",
          providerReference: result.mode === "redirect" ? result.providerReference : null,
          amount: order.total,
          status: "INITIATED",
        },
      });
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PENDING" } });

      return NextResponse.json({
        orderNumber: order.orderNumber,
        paymentMode: result.mode,
        redirectUrl: result.mode === "redirect" ? result.redirectUrl : null,
      });
    }

    return NextResponse.json({ orderNumber: order.orderNumber, paymentMode: "none", redirectUrl: null });
  } catch (error) {
    if (error instanceof OrderCreationError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Something went wrong while placing your order." }, { status: 500 });
  }
}
