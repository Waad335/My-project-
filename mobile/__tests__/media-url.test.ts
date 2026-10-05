import { resolveMediaUrl } from "@/api/media";

describe("resolveMediaUrl", () => {
  const phoneApi = "http://192.168.1.20:3000";

  it("points the website's localhost photo addresses at the server the phone uses", () => {
    expect(resolveMediaUrl("http://localhost:3000/placeholders/perfumes.svg", phoneApi, true)).toBe("http://192.168.1.20:3000/placeholders/perfumes.svg");
    expect(resolveMediaUrl("http://127.0.0.1:3000/categories/bags.jpg?v=2", phoneApi, true)).toBe("http://192.168.1.20:3000/categories/bags.jpg?v=2");
    expect(resolveMediaUrl("http://0.0.0.0:3000/uploads/a.webp", phoneApi, true)).toBe("http://192.168.1.20:3000/uploads/a.webp");
    expect(resolveMediaUrl("http://[::1]:3000/hero/hero-visual.png", phoneApi, true)).toBe("http://192.168.1.20:3000/hero/hero-visual.png");
    expect(resolveMediaUrl("http://LOCALHOST/categories/kids.jpg", "http://10.0.2.2:4010", true)).toBe("http://10.0.2.2:4010/categories/kids.jpg");
  });

  it("leaves every other address alone", () => {
    const real = [
      "https://abc.supabase.co/storage/v1/object/public/products/a.jpg",
      "http://192.168.1.20:3000/categories/bags.jpg",
      "http://localhost.example.com/a.jpg",
      "http://user@localhost:3000/a.jpg",
      "data:image/png;base64,AAAA",
      "/categories/bags.jpg",
    ];
    for (const url of real) expect(resolveMediaUrl(url, phoneApi, true)).toBe(url);
  });

  it("changes nothing when the app itself talks to localhost (web preview, simulators)", () => {
    expect(resolveMediaUrl("http://localhost:3000/categories/bags.jpg", "http://localhost:4010", true)).toBe("http://localhost:3000/categories/bags.jpg");
  });

  it("never changes anything in release builds", () => {
    expect(resolveMediaUrl("http://localhost:3000/categories/bags.jpg", "https://shop.example.test", false)).toBe("http://localhost:3000/categories/bags.jpg");
  });

  it("keeps a missing photo missing", () => {
    expect(resolveMediaUrl(null, phoneApi, true)).toBeNull();
    expect(resolveMediaUrl("", phoneApi, true)).toBeNull();
    expect(resolveMediaUrl(undefined, null, true)).toBeNull();
  });
});
