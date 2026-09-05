import crypto from "node:crypto";
import type { PaymentInitResult, PaymentProvider, PaymentWebhookResult } from "./types";

/**
 * Paymob (https://paymob.com) — Egypt's most widely used local payment
 * gateway. Supports Visa/Mastercard, Meeza, and mobile wallets (Vodafone
 * Cash, etc.), and settles to an Egyptian bank account.
 *
 * This implements Paymob's "Accept" flow:
 *   1. Auth      -> get a short-lived auth token from the API key
 *   2. Order      -> register the order on Paymob's side
 *   3. Payment key -> request a payment token scoped to one integration
 *      (card or wallet) and amount
 *   4. Redirect the customer to the hosted iFrame to actually pay
 *   5. Paymob calls our webhook with the transaction result, HMAC-signed
 *
 * Nothing here ever touches raw card data — Paymob's iframe collects it.
 */

const BASE_URL = "https://accept.paymob.com/api";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function authenticate(): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: getEnv("PAYMOB_API_KEY") }),
  });
  if (!res.ok) throw new Error(`Paymob auth failed: ${res.status}`);
  const data = (await res.json()) as { token: string };
  return data.token;
}

async function registerOrder(authToken: string, amountCents: number, orderNumber: string) {
  const res = await fetch(`${BASE_URL}/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      merchant_order_id: orderNumber,
      items: [],
    }),
  });
  if (!res.ok) throw new Error(`Paymob order registration failed: ${res.status}`);
  const data = (await res.json()) as { id: number };
  return data.id;
}

async function requestPaymentKey(
  authToken: string,
  amountCents: number,
  paymobOrderId: number,
  customer: { name: string; phone: string; email?: string | null },
  integrationId: string
) {
  const [firstName, ...rest] = customer.name.trim().split(" ");
  const res = await fetch(`${BASE_URL}/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: paymobOrderId,
      currency: "EGP",
      integration_id: Number(integrationId),
      billing_data: {
        first_name: firstName || "Customer",
        last_name: rest.join(" ") || "DODANA",
        phone_number: customer.phone,
        email: customer.email || "customer@dodana.com",
        apartment: "NA",
        floor: "NA",
        street: "NA",
        building: "NA",
        city: "NA",
        country: "EG",
        state: "NA",
      },
    }),
  });
  if (!res.ok) throw new Error(`Paymob payment key request failed: ${res.status}`);
  const data = (await res.json()) as { token: string };
  return data.token;
}

export const paymobProvider: PaymentProvider = {
  id: "PAYMOB",
  isConfigured: Boolean(
    process.env.PAYMOB_API_KEY &&
      process.env.PAYMOB_HMAC_SECRET &&
      process.env.PAYMOB_CARD_INTEGRATION_ID &&
      process.env.PAYMOB_IFRAME_ID
  ),

  async initiate({ orderNumber, amountEGP, customer }): Promise<PaymentInitResult> {
    if (!this.isConfigured) {
      throw new Error(
        "Paymob is not configured. Set PAYMOB_API_KEY, PAYMOB_HMAC_SECRET, PAYMOB_CARD_INTEGRATION_ID, and PAYMOB_IFRAME_ID."
      );
    }
    const amountCents = Math.round(amountEGP * 100);
    const authToken = await authenticate();
    const paymobOrderId = await registerOrder(authToken, amountCents, orderNumber);
    const paymentToken = await requestPaymentKey(
      authToken,
      amountCents,
      paymobOrderId,
      customer,
      getEnv("PAYMOB_CARD_INTEGRATION_ID")
    );
    const iframeId = getEnv("PAYMOB_IFRAME_ID");

    return {
      mode: "redirect",
      redirectUrl: `${BASE_URL}/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`,
      providerReference: String(paymobOrderId),
    };
  },

  verifyWebhook({ payload, url }): PaymentWebhookResult {
    const hmacParam = url.searchParams.get("hmac");

    const body = payload as { obj?: Record<string, unknown> };
    const obj = body.obj;
    if (!obj) throw new Error("Malformed Paymob webhook payload: missing obj");

    if (hmacParam) {
      const orderedKeys = [
        "amount_cents",
        "created_at",
        "currency",
        "error_occured",
        "has_parent_transaction",
        "id",
        "integration_id",
        "is_3d_secure",
        "is_auth",
        "is_capture",
        "is_refunded",
        "is_standalone_payment",
        "is_voided",
        "order.id",
        "owner",
        "pending",
        "source_data.pan",
        "source_data.sub_type",
        "source_data.type",
        "success",
      ];
      const flat: Record<string, unknown> = { ...obj };
      const order = obj.order as Record<string, unknown> | undefined;
      const sourceData = obj.source_data as Record<string, unknown> | undefined;
      flat["order.id"] = order?.id;
      flat["source_data.pan"] = sourceData?.pan;
      flat["source_data.sub_type"] = sourceData?.sub_type;
      flat["source_data.type"] = sourceData?.type;

      const concatenated = orderedKeys.map((key) => String(flat[key] ?? "")).join("");
      const computedHmac = crypto
        .createHmac("sha512", getEnv("PAYMOB_HMAC_SECRET"))
        .update(concatenated)
        .digest("hex");

      if (computedHmac !== hmacParam) {
        throw new Error("Invalid Paymob webhook signature (HMAC mismatch)");
      }
    }

    const order = obj.order as Record<string, unknown> | undefined;

    return {
      providerReference: String(order?.id ?? obj.id ?? ""),
      orderNumber: typeof order?.merchant_order_id === "string" ? order.merchant_order_id : undefined,
      success: Boolean(obj.success),
      amountCents: typeof obj.amount_cents === "number" ? obj.amount_cents : undefined,
      raw: payload,
    };
  },
};
