import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative, sep } from "path";
import type { ApiClient, RequestOptions } from "@/api/client";
import { createEndpoints } from "@/api/endpoints";

// The app may only call endpoints that exist on the server: every request
// the app can make must match a route file under src/app/api/mobile/v1
// that exports the HTTP method it uses. Nothing is invented on the client.

const V1 = join(__dirname, "..", "..", "src", "app", "api", "mobile", "v1");

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return routeFiles(path);
    return name === "route.ts" ? [path] : [];
  });
}

// The folders above each route.ts are the URL path. They're split with the
// platform's separator ("\\" on Windows), so this works on every system.
const routes = routeFiles(V1).map((file) => {
  const pattern = relative(V1, file)
    .split(sep)
    .slice(0, -1)
    .map((segment) => (/^\[.+\]$/.test(segment) ? "[^/]+" : segment.replace(/[.*+?^${}()|\\]/g, "\\$&")))
    .join("/");
  return { file, matcher: new RegExp(`^/${pattern}$`), source: readFileSync(file, "utf8") };
});

function exportsMethod(source: string, method: string): boolean {
  return new RegExp(`export const ${method}\\b|export \\{[^}]*\\b${method}\\b[^}]*\\}`).test(source);
}

describe("API contract", () => {
  it("finds the server's mobile routes", () => {
    expect(existsSync(V1)).toBe(true);
    expect(routes.length).toBeGreaterThan(10);
  });

  it("every endpoint the app calls exists on the server with that method", async () => {
    const calls: { path: string; method: string }[] = [];
    const client: ApiClient = {
      request: async <T,>(path: string, options?: RequestOptions) => {
        calls.push({ path, method: options?.method ?? "GET" });
        return {} as T;
      },
    };
    const api = createEndpoints(client) as Record<string, (...args: unknown[]) => Promise<unknown>>;
    for (const call of Object.values(api)) await call("some-slug", 1);

    expect(calls.length).toBe(Object.keys(api).length);
    for (const { path, method } of calls) {
      const pathname = path.split("?")[0]!;
      const route = routes.find((r) => r.matcher.test(pathname));
      expect({ path: pathname, routeFound: Boolean(route) }).toEqual({ path: pathname, routeFound: true });
      expect({ path: pathname, method, exported: exportsMethod(route!.source, method) }).toEqual({
        path: pathname,
        method,
        exported: true,
      });
    }
  });

  it("catalogue browsing only uses the public catalogue endpoints", () => {
    const src = join(__dirname, "..", "src");
    const files = [
      "catalog/queries.ts",
      "components/catalog/SearchSuggestions.tsx",
      "components/catalog/ProductBrowser.tsx",
      "app/(tabs)/index.tsx",
      "app/(tabs)/shop.tsx",
      "app/category/[slug].tsx",
      "app/product/[slug].tsx",
    ].map((file) => readFileSync(join(src, file), "utf8"));
    const used = new Set(files.flatMap((source) => [...source.matchAll(/\bapi\s*\.\s*(\w+)/g)].map((m) => m[1])));
    expect([...used].sort()).toEqual(["getCategories", "getCategory", "getHome", "getProduct", "getSettings", "listProducts", "searchSuggest"]);
  });

  it("the cart and wishlist only use the existing saved cart and wishlist endpoints", () => {
    const src = join(__dirname, "..", "src");
    const files = [
      "shopping/account-sync.ts",
      "shopping/cart-store.ts",
      "shopping/wishlist-store.ts",
      "shopping/storage.ts",
      "components/shopping/AddToCart.tsx",
      "components/shopping/WishlistButton.tsx",
      "components/shopping/QuantityStepper.tsx",
      "app/(tabs)/cart.tsx",
      "app/(tabs)/wishlist.tsx",
    ].map((file) => readFileSync(join(src, file), "utf8"));
    const used = new Set(files.flatMap((source) => [...source.matchAll(/\bapi\s*\.\s*(\w+)/g)].map((m) => m[1])));
    expect([...used].sort()).toEqual(["getCart", "getWishlist", "saveCart", "saveWishlist"]);
  });

  it("signing in and out only uses the existing account endpoints", () => {
    const src = join(__dirname, "..", "src");
    const files = [
      "auth/session-store.ts",
      "auth/token-storage.ts",
      "auth/validation.ts",
      "auth/form-errors.ts",
      "app/auth/sign-in.tsx",
      "app/auth/register.tsx",
      "app/auth/forgot-password.tsx",
      "app/(tabs)/account.tsx",
      "components/auth/AuthShell.tsx",
    ].map((file) => readFileSync(join(src, file), "utf8"));
    const used = new Set(files.flatMap((source) => [...source.matchAll(/\bapi\s*\.\s*(\w+)/g)].map((m) => m[1])));
    expect([...used].sort()).toEqual(["forgotPassword", "getMe", "login", "register"]);
  });
});
