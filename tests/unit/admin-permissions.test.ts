// Unit tests for the admin role matrix (src/lib/admin-permissions.ts).
// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PERMISSIONS,
  ORDER_STATUSES,
  allowedOrderStatuses,
  can,
  canSetOrderStatus,
  isAdminRole,
  permissionForAdminApi,
  permissionForAdminPage,
  roleMayAccess,
  type Permission,
} from "../../src/lib/admin-permissions";

const ALL = Object.keys(PERMISSIONS) as Permission[];
const STAFF_ALLOWED: Permission[] = ["dashboard.view", "orders.view", "orders.fulfil", "products.view"];

test("ADMIN holds every permission", () => {
  for (const p of ALL) assert.equal(can("ADMIN", p), true, p);
});

test("STAFF holds exactly the fulfilment permissions", () => {
  for (const p of ALL) assert.equal(can("STAFF", p), STAFF_ALLOWED.includes(p), p);
});

test("STAFF cannot see customer data beyond the delivery contact", () => {
  assert.equal(can("STAFF", "customers.view"), false);
  assert.equal(can("STAFF", "customers.email"), false);
  assert.equal(can("STAFF", "dashboard.business"), false);
  assert.equal(can("STAFF", "orders.finance"), false);
});

test("no role / unknown role holds anything", () => {
  for (const p of ALL) {
    assert.equal(can(null, p), false);
    assert.equal(can(undefined, p), false);
  }
  assert.equal(isAdminRole("ADMIN"), true);
  assert.equal(isAdminRole("STAFF"), true);
  for (const v of ["admin", "OWNER", "", null, undefined, 1, {}]) assert.equal(isAdminRole(v), false);
});

test("order status: ADMIN may set any status from any status", () => {
  for (const from of ORDER_STATUSES) {
    for (const to of ORDER_STATUSES) assert.equal(canSetOrderStatus("ADMIN", from, to), true, `${from}→${to}`);
  }
});

test("order status: STAFF only moves open orders through fulfilment", () => {
  assert.equal(canSetOrderStatus("STAFF", "PAID", "PREPARING"), true);
  assert.equal(canSetOrderStatus("STAFF", "PREPARING", "SHIPPED"), true);
  assert.equal(canSetOrderStatus("STAFF", "SHIPPED", "OUT_FOR_DELIVERY"), true);
  assert.equal(canSetOrderStatus("STAFF", "OUT_FOR_DELIVERY", "DELIVERED"), true);
  assert.equal(canSetOrderStatus("STAFF", "PENDING", "PREPARING"), true); // cash on delivery
  // Money-affecting targets.
  for (const to of ["PENDING", "PAYMENT_PENDING", "PAID", "CANCELLED", "RETURNED_REFUNDED"]) {
    assert.equal(canSetOrderStatus("STAFF", "PREPARING", to), false, `PREPARING→${to}`);
  }
  // Closed orders can't be re-opened by STAFF, but notes-only saves still work.
  assert.equal(canSetOrderStatus("STAFF", "CANCELLED", "PREPARING"), false);
  assert.equal(canSetOrderStatus("STAFF", "RETURNED_REFUNDED", "DELIVERED"), false);
  assert.equal(canSetOrderStatus("STAFF", "CANCELLED", "CANCELLED"), true);
  assert.equal(canSetOrderStatus(null, "PREPARING", "SHIPPED"), false);
});

test("allowedOrderStatuses matches the status rule", () => {
  assert.deepEqual(allowedOrderStatuses("ADMIN", "PENDING"), [...ORDER_STATUSES]);
  assert.deepEqual(allowedOrderStatuses("STAFF", "PENDING"), ["PENDING", "PREPARING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]);
  assert.deepEqual(allowedOrderStatuses("STAFF", "CANCELLED"), ["CANCELLED"]);
  assert.deepEqual(allowedOrderStatuses(null, "PENDING"), []);
});

test("admin pages map to the expected permission", () => {
  const cases: [string, Permission | null][] = [
    ["/admin", "dashboard.view"],
    ["/admin/", "dashboard.view"],
    ["/admin/denied", "dashboard.view"],
    ["/admin/orders", "orders.view"],
    ["/admin/orders/abc", "orders.view"],
    ["/admin/products", "products.view"],
    ["/admin/products/new", "products.manage"],
    ["/admin/products/abc", "products.manage"],
    ["/admin/customers", "customers.view"],
    ["/admin/customers/", "customers.view"],
    ["/admin/categories", "categories.manage"],
    ["/admin/shipping", "shipping.manage"],
    ["/admin/promo-codes", "promos.manage"],
    ["/admin/instagram", "instagram.manage"],
    ["/admin/settings", "settings.manage"],
    ["/admin/something-new", null],
  ];
  for (const [path, expected] of cases) assert.equal(permissionForAdminPage(path), expected, path);
});

test("admin APIs map to the expected permission per method", () => {
  const cases: [string, string, Permission | null][] = [
    ["/api/admin/orders", "GET", "orders.view"],
    ["/api/admin/orders", "POST", null],
    ["/api/admin/orders/abc", "PATCH", "orders.fulfil"],
    ["/api/admin/orders/abc", "DELETE", null],
    ["/api/admin/products", "GET", "products.view"],
    ["/api/admin/products", "POST", "products.manage"],
    ["/api/admin/products/abc", "GET", "products.view"],
    ["/api/admin/products/abc", "PATCH", "products.manage"],
    ["/api/admin/products/abc", "DELETE", "products.manage"],
    ["/api/admin/upload", "POST", "products.manage"],
    ["/api/admin/categories", "GET", "categories.manage"],
    ["/api/admin/shipping-zones/abc", "PATCH", "shipping.manage"],
    ["/api/admin/promo-codes", "GET", "promos.manage"],
    ["/api/admin/instagram/sync", "POST", "instagram.manage"],
    ["/api/admin/instagram/callback", "GET", "instagram.manage"],
    ["/api/admin/settings", "GET", "settings.manage"],
    ["/api/admin/unknown", "GET", null],
  ];
  for (const [path, method, expected] of cases) {
    assert.equal(permissionForAdminApi(path, method), expected, `${method} ${path}`);
  }
});

test("unmapped routes are ADMIN-only (default deny)", () => {
  assert.equal(roleMayAccess("ADMIN", null), true);
  assert.equal(roleMayAccess("STAFF", null), false);
  assert.equal(roleMayAccess(null, "dashboard.view"), false);
  assert.equal(roleMayAccess("STAFF", "customers.view"), false);
  assert.equal(roleMayAccess("STAFF", "orders.view"), true);
});
