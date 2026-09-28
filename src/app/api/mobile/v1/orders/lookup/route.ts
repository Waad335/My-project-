// Guest order tracking — the website's own endpoint, mounted unchanged:
// POST { orderNumber, phone } → { found, order? } (no delivery details).
export { POST } from "@/app/api/orders/lookup/route";

export const dynamic = "force-dynamic";
