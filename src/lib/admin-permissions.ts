// Admin role-based access control — the single source of truth for what each
// admin role may do. Pure and dependency-free so the middleware (edge), the
// server guards and the sidebar all read the same rules.
//
// Principle: ADMIN keeps full access to every existing feature. STAFF gets
// only what order fulfilment needs (see orders, their delivery contact, move
// them through preparation/shipping/delivery, check products & stock) and
// nothing that exposes the customer directory, store configuration,
// third-party integrations or money-affecting actions. Anything not listed
// for a role is denied.

export type AdminRole = "ADMIN" | "STAFF";

export const PERMISSIONS = {
  // Dashboard: order/stock counts and recent orders.
  "dashboard.view": ["ADMIN", "STAFF"],
  // Dashboard business figures: revenue, customer/account/subscriber counts.
  "dashboard.business": ["ADMIN"],
  // Orders list + order detail, incl. the delivery contact needed to ship
  // (name, phone/WhatsApp, delivery address, customer notes).
  "orders.view": ["ADMIN", "STAFF"],
  // Move an order through fulfilment (PREPARING → SHIPPED → OUT FOR DELIVERY
  // → DELIVERED) and edit internal notes.
  "orders.fulfil": ["ADMIN", "STAFF"],
  // Money-affecting order changes (PAID, CANCELLED, RETURNED/REFUNDED, back
  // to PENDING/PAYMENT PENDING) and payment provider references.
  "orders.finance": ["ADMIN"],
  // Customer email address (not needed to deliver an order).
  "customers.email": ["ADMIN"],
  // Customers page: buyer directory, registered accounts, newsletter list.
  "customers.view": ["ADMIN"],
  // Product list with stock (read-only).
  "products.view": ["ADMIN", "STAFF"],
  // Create / edit / delete products, prices, stock, images, 3D models.
  "products.manage": ["ADMIN"],
  "categories.manage": ["ADMIN"],
  "shipping.manage": ["ADMIN"],
  "promos.manage": ["ADMIN"],
  "instagram.manage": ["ADMIN"],
  "settings.manage": ["ADMIN"],
} as const satisfies Record<string, readonly AdminRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function isAdminRole(value: unknown): value is AdminRole {
  return value === "ADMIN" || value === "STAFF";
}

export function can(role: AdminRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly AdminRole[]).includes(role);
}

// ── Order status rules ──────────────────────────────────────────────────
// Mirrors the OrderStatus enum in prisma/schema.prisma, in workflow order.
export const ORDER_STATUSES = [
  "PENDING",
  "PAYMENT_PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED_REFUNDED",
] as const;
export const FULFILMENT_STATUSES = ["PREPARING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
// Once an order is cancelled or refunded, only a finance-level role may move it.
const CLOSED_STATUSES = ["CANCELLED", "RETURNED_REFUNDED"];

export function canSetOrderStatus(role: AdminRole | null | undefined, currentStatus: string, nextStatus: string): boolean {
  if (can(role, "orders.finance")) return true;
  if (!can(role, "orders.fulfil")) return false;
  if (nextStatus === currentStatus) return true; // notes-only update
  if (CLOSED_STATUSES.includes(currentStatus)) return false;
  return (FULFILMENT_STATUSES as readonly string[]).includes(nextStatus);
}

// The statuses a role may pick for an order currently in `currentStatus`
// (always includes the current one, so notes can still be saved).
export function allowedOrderStatuses(role: AdminRole | null | undefined, currentStatus: string): string[] {
  return ORDER_STATUSES.filter((s) => canSetOrderStatus(role, currentStatus, s));
}

// ── Route → permission maps (default deny: unknown routes are ADMIN-only) ─

// Returns the permission an /admin page requires, or null for "ADMIN only".
export function permissionForAdminPage(pathname: string): Permission | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/admin" || path === "/admin/denied") return "dashboard.view";
  if (path === "/admin/orders" || path.startsWith("/admin/orders/")) return "orders.view";
  if (path === "/admin/products") return "products.view";
  if (path.startsWith("/admin/products/")) return "products.manage"; // new + edit
  if (path.startsWith("/admin/customers")) return "customers.view";
  if (path.startsWith("/admin/categories")) return "categories.manage";
  if (path.startsWith("/admin/shipping")) return "shipping.manage";
  if (path.startsWith("/admin/promo-codes")) return "promos.manage";
  if (path.startsWith("/admin/instagram")) return "instagram.manage";
  if (path.startsWith("/admin/settings")) return "settings.manage";
  return null;
}

// Returns the permission an /api/admin request requires, or null for "ADMIN only".
export function permissionForAdminApi(pathname: string, method: string): Permission | null {
  const path = pathname.replace(/\/+$/, "");
  const m = method.toUpperCase();
  if (path === "/api/admin/orders") return m === "GET" ? "orders.view" : null;
  if (path.startsWith("/api/admin/orders/")) return m === "PATCH" ? "orders.fulfil" : null;
  if (path === "/api/admin/products" || path.startsWith("/api/admin/products/")) {
    return m === "GET" ? "products.view" : "products.manage";
  }
  if (path.startsWith("/api/admin/upload")) return "products.manage";
  if (path.startsWith("/api/admin/categories")) return "categories.manage";
  if (path.startsWith("/api/admin/shipping-zones")) return "shipping.manage";
  if (path.startsWith("/api/admin/promo-codes")) return "promos.manage";
  if (path.startsWith("/api/admin/instagram")) return "instagram.manage";
  if (path.startsWith("/api/admin/settings")) return "settings.manage";
  return null;
}

export function roleMayAccess(role: AdminRole | null | undefined, permission: Permission | null): boolean {
  if (!role) return false;
  return permission ? can(role, permission) : role === "ADMIN";
}
