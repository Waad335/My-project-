// Promo code check — the website's own endpoint, mounted unchanged:
// POST { code, subtotal } → { valid, code?, discountAmount?, message? }.
// The discount is re-validated server-side again at checkout.
export { POST } from "@/app/api/promo/validate/route";

export const dynamic = "force-dynamic";
