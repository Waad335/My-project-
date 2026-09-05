import type { PaymentInitResult, PaymentProvider, PaymentWebhookResult } from "./types";

/** Cash on Delivery — no external gateway involved, always available. */
export const codProvider: PaymentProvider = {
  id: "COD",
  isConfigured: true,

  async initiate(): Promise<PaymentInitResult> {
    return { mode: "none", providerReference: `COD-${Date.now()}` };
  },

  verifyWebhook(): PaymentWebhookResult {
    throw new Error("COD does not send webhooks.");
  },
};
