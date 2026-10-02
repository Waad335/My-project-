import { createApiClient, type ApiClientDeps } from "@/api/client";
import { ApiError } from "@/api/errors";

type Call = { url: string; init: RequestInit };

function jsonResponse(status: number, body: unknown, raw?: string): Response {
  const text = raw ?? JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
  } as unknown as Response;
}

function setup(overrides: Partial<ApiClientDeps> = {}, respond: (call: Call) => Promise<Response> | Response = () => jsonResponse(200, { ok: true })) {
  const calls: Call[] = [];
  const onUnauthorized = jest.fn();
  const client = createApiClient({
    config: { ok: true, baseUrl: "http://localhost:3000" },
    getToken: async () => "app-token",
    getLocale: () => "ar",
    onUnauthorized,
    fetchImpl: (async (url: string, init: RequestInit) => {
      const call = { url, init };
      calls.push(call);
      return respond(call);
    }) as unknown as typeof fetch,
    ...overrides,
  });
  return { client, calls, onUnauthorized };
}

const header = (call: Call | undefined, name: string) => (call?.init.headers as Record<string, string>)[name];

describe("createApiClient", () => {
  it("builds the v1 URL and sends the current language", async () => {
    const { client, calls } = setup();
    await client.request("/settings");
    expect(calls[0]?.url).toBe("http://localhost:3000/api/mobile/v1/settings");
    expect(calls[0]?.init.method).toBe("GET");
    expect(header(calls[0], "Accept-Language")).toBe("ar");
    expect(header(calls[0], "Accept")).toBe("application/json");
  });

  it("never sends the token to public endpoints", async () => {
    const { client, calls } = setup();
    await client.request("/home");
    expect(header(calls[0], "Authorization")).toBeUndefined();
  });

  it("sends the token as a Bearer header when the endpoint uses one", async () => {
    const { client, calls } = setup();
    await client.request("/me", { auth: "required" });
    await client.request("/checkout", { method: "POST", body: { a: 1 }, auth: "optional" });
    expect(header(calls[0], "Authorization")).toBe("Bearer app-token");
    expect(header(calls[1], "Authorization")).toBe("Bearer app-token");
    expect(header(calls[1], "Content-Type")).toBe("application/json");
    expect(calls[1]?.init.body).toBe('{"a":1}');
  });

  it("checks out as a guest without a token, but refuses signed-in endpoints", async () => {
    const { client, calls } = setup({ getToken: async () => null });
    await client.request("/checkout", { method: "POST", body: {}, auth: "optional" });
    expect(header(calls[0], "Authorization")).toBeUndefined();
    await expect(client.request("/me", { auth: "required" })).rejects.toMatchObject({ status: 401, code: "unauthorized" });
    expect(calls).toHaveLength(1);
  });

  it("turns the API's error shape into an ApiError with the localized message and field codes", async () => {
    const { client } = setup({}, () =>
      jsonResponse(409, { error: { code: "emailInUse", message: "الإيميل ده مستخدم", fieldErrors: { email: "emailInUse" } } })
    );
    const error = await client.request("/auth/register", { method: "POST", body: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: "emailInUse",
      serverMessage: "الإيميل ده مستخدم",
      fieldErrors: { email: "emailInUse" },
    });
  });

  it("signs out when the server rejects the token", async () => {
    const { client, onUnauthorized } = setup({}, () => jsonResponse(401, { error: { code: "unauthorized", message: "x" } }));
    await expect(client.request("/me", { auth: "required" })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("does not sign out for a 401 on a request sent without a token", async () => {
    const { client, onUnauthorized } = setup({}, () => jsonResponse(401, { error: { code: "invalidCredentials", message: "x" } }));
    await expect(client.request("/auth/login", { method: "POST", body: {} })).rejects.toMatchObject({ code: "invalidCredentials" });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("handles responses that aren't the API's JSON", async () => {
    const { client } = setup({}, () => jsonResponse(502, null, "<html>Bad gateway</html>"));
    await expect(client.request("/home")).rejects.toMatchObject({ status: 502, code: "serverError", serverMessage: null });

    const empty = setup({}, () => jsonResponse(200, null, ""));
    await expect(empty.client.request("/home")).rejects.toMatchObject({ code: "invalidResponse" });
  });

  it("reports a network failure", async () => {
    const { client } = setup({}, () => {
      throw new TypeError("Network request failed");
    });
    await expect(client.request("/home")).rejects.toMatchObject({ status: 0, code: "network" });
  });

  it("gives up after the timeout", async () => {
    const { client } = setup({ timeoutMs: 20 }, ({ init }) =>
      new Promise<Response>((_, reject) => {
        init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      })
    );
    await expect(client.request("/home")).rejects.toMatchObject({ status: 0, code: "timeout" });
  });

  it("refuses to send anything when the API address isn't configured", async () => {
    const { client, calls } = setup({ config: { ok: false, reason: "not set" } });
    await expect(client.request("/home")).rejects.toMatchObject({ status: 0, code: "config" });
    expect(calls).toHaveLength(0);
  });
});
