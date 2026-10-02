import { PRODUCTION_API_HOSTS, resolveApiBaseUrl } from "@/api/config";

describe("resolveApiBaseUrl", () => {
  it("has no default: a missing address is an error, never a fallback", () => {
    expect(resolveApiBaseUrl(undefined, true)).toEqual({ ok: false, reason: expect.stringContaining("not set") });
    expect(resolveApiBaseUrl("   ", true).ok).toBe(false);
    expect(resolveApiBaseUrl(undefined, false).ok).toBe(false);
  });

  it("accepts a local development server", () => {
    expect(resolveApiBaseUrl("http://localhost:3000", true)).toEqual({ ok: true, baseUrl: "http://localhost:3000" });
    expect(resolveApiBaseUrl("http://192.168.1.20:3000/", true)).toEqual({ ok: true, baseUrl: "http://192.168.1.20:3000" });
    expect(resolveApiBaseUrl("http://10.0.2.2:3000", true)).toEqual({ ok: true, baseUrl: "http://10.0.2.2:3000" });
  });

  it("requires HTTPS in release builds", () => {
    expect(resolveApiBaseUrl("http://localhost:3000", false)).toEqual({ ok: false, reason: expect.stringContaining("https") });
    expect(resolveApiBaseUrl("https://api.example.test", false)).toEqual({ ok: true, baseUrl: "https://api.example.test" });
  });

  it("refuses the live store's address in development builds", () => {
    for (const host of PRODUCTION_API_HOSTS) {
      expect(resolveApiBaseUrl(`https://${host}`, true)).toEqual({ ok: false, reason: expect.stringContaining("live store") });
      expect(resolveApiBaseUrl(`https://${host.toUpperCase()}/`, true).ok).toBe(false);
    }
  });

  it("rejects anything but a plain origin", () => {
    for (const bad of [
      "not a url",
      "ftp://example.test",
      "http://user:secret@localhost:3000",
      "http://localhost:3000/api",
      "http://localhost:3000?x=1",
      "http://localhost:3000#frag",
    ]) {
      expect(resolveApiBaseUrl(bad, true).ok).toBe(false);
    }
  });
});
