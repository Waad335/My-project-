import type { PaymentProvider } from "./types";
import { codProvider } from "./cod";
import { paymobProvider } from "./paymob";

export type { PaymentProvider, PaymentInitResult, PaymentWebhookResult } from "./types";

const providers: Record<"COD" | "PAYMOB", PaymentProvider> = {
  COD: codProvider,
  PAYMOB: paymobProvider,
};

export function getPaymentProvider(id: "COD" | "PAYMOB"): PaymentProvider {
  return providers[id];
}
