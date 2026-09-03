import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";

/**
 * Paymob calls this endpoint (the "Transaction processed callback" webhook,
 * configured in Paymob dashboard > Developers > Webhooks) after a payment
 * attempt. The HMAC signature is verified inside paymobProvider.verifyWebhook
 * before anything here is trusted.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const rawBody = await request.text();

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const provider = getPaymentProvider("PAYMOB");
  let result;
  try {
    result = provider.verifyWebhook({ payload, headers: request.headers, url });
  } catch (error) {
    console.error("Paymob webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const order = result.orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber: result.orderNumber } })
    : await prisma.payment
        .findFirst({ where: { providerReference: result.providerReference }, include: { order: true } })
        .then((p) => p?.order ?? null);

  if (!order) {
    return NextResponse.json({ error: "Order not found for this transaction" }, { status: 404 });
  }

  await prisma.payment.updateMany({
    where: { orderId: order.id, provider: "PAYMOB" },
    data: {
      status: result.success ? "SUCCESS" : "FAILED",
      providerReference: result.providerReference || undefined,
      rawPayload: payload as object,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: result.success ? "PAID" : "FAILED",
      status: result.success ? "PAID" : order.status,
    },
  });

  return NextResponse.json({ received: true });
}
