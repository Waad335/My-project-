export type PaymentInitResult =
  | { mode: "redirect"; redirectUrl: string; providerReference: string }
  | { mode: "none"; providerReference: string };

export type PaymentWebhookResult = {
  providerReference: string;
  orderNumber?: string;
  success: boolean;
  amountCents?: number;
  raw: unknown;
};

/**
 * Every payment provider (Paymob today, another gateway tomorrow) implements
 * this interface. Nothing outside this folder talks to a provider's SDK or
 * REST API directly, so switching providers means adding one new file here
 * and pointing `getPaymentProvider()` at it — the checkout flow, webhook
 * route, and admin dashboard never change.
 */
export interface PaymentProvider {
  readonly id: "COD" | "PAYMOB";
  readonly isConfigured: boolean;

  /** Create the payment on the provider's side and return where to send the customer (if anywhere). */
  initiate(params: {
    orderNumber: string;
    amountEGP: number;
    customer: { name: string; phone: string; email?: string | null };
  }): Promise<PaymentInitResult>;

  /** Verify + parse an inbound webhook/notification payload. Must reject anything not authentically signed by the provider. */
  verifyWebhook(params: { payload: unknown; headers: Headers; url: URL }): PaymentWebhookResult;
}
