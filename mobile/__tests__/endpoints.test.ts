import type { ApiClient, RequestOptions } from "@/api/client";
import { createEndpoints, queryString } from "@/api/endpoints";

function recordingClient() {
  const calls: { path: string; options?: RequestOptions }[] = [];
  const client: ApiClient = {
    request: async <T,>(path: string, options?: RequestOptions) => {
      calls.push({ path, options });
      return {} as T;
    },
  };
  return { api: createEndpoints(client), calls };
}

describe("endpoints", () => {
  it("maps catalog calls to public GET requests", async () => {
    const { api, calls } = recordingClient();
    await api.getHome();
    await api.getProduct("rose oil/50ml");
    await api.listProducts({ q: "rose", category: "skincare", sort: "price-asc", page: 2, minPrice: undefined });
    await api.searchSuggest("ro");
    expect(calls.map((c) => c.path)).toEqual([
      "/home",
      "/products/rose%20oil%2F50ml",
      "/products?q=rose&category=skincare&sort=price-asc&page=2",
      "/search/suggest?q=ro",
    ]);
    expect(calls.every((c) => (c.options?.auth ?? "none") === "none")).toBe(true);
  });

  it("marks account endpoints as needing the customer's token", async () => {
    const { api, calls } = recordingClient();
    await api.getMe();
    await api.updateMe({ name: "Nour" });
    await api.deleteAccount("secret-pass");
    await api.saveCart([{ productId: "p1", variantId: null, quantity: 2 }]);
    await api.getOrder("dod-2609-1234");
    expect(calls.map((c) => [c.path, c.options?.method ?? "GET", c.options?.auth])).toEqual([
      ["/me", "GET", "required"],
      ["/me", "PATCH", "required"],
      ["/me", "DELETE", "required"],
      ["/me/cart", "PUT", "required"],
      ["/me/orders/dod-2609-1234", "GET", "required"],
    ]);
    expect(calls[2]?.options?.body).toEqual({ password: "secret-pass" });
  });

  it("lets checkout work for guests and signed-in customers", async () => {
    const { api, calls } = recordingClient();
    await api.checkout({
      name: "Nour",
      phone: "01012345678",
      governorate: "Cairo",
      city: "Maadi",
      address: "1 Street",
      paymentMethod: "COD",
      items: [{ productId: "p1", quantity: 1 }],
    });
    expect(calls[0]).toMatchObject({ path: "/checkout", options: { method: "POST", auth: "optional" } });
  });

  it("builds query strings without empty values", () => {
    expect(queryString({})).toBe("");
    expect(queryString({ q: "", page: undefined })).toBe("");
    expect(queryString({ q: "عطر", page: 1 })).toBe("?q=%D8%B9%D8%B7%D8%B1&page=1");
  });
});
