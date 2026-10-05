import { readFileSync } from "fs";
import { join } from "path";
import { Platform } from "react-native";
import { render, screen, waitFor } from "@testing-library/react-native";
import { ProductImage, isSvgUrl } from "@/components/catalog/ProductImage";

jest.mock("@/i18n/I18nProvider", () => ({ useLocale: () => "en" }));

// The website's own product placeholders (public/placeholders), the only
// product images the seed data has.
const PLACEHOLDERS = ["accessories", "bags", "haircare", "perfumes", "skincare"];
const placeholder = (name: string) => readFileSync(join(__dirname, "../../public/placeholders", `${name}.svg`), "utf8");
const url = (name: string) => `http://192.168.1.20:4010/placeholders/${name}.svg`;

type HostNode = { type: string; children: (HostNode | string)[] };
function hostTypes(node: HostNode | string | null, found = new Set<string>()): Set<string> {
  if (!node || typeof node === "string") return found;
  found.add(node.type);
  for (const child of node.children) hostTypes(child, found);
  return found;
}
const rendered = () => hostTypes(screen.getByLabelText("Photo") as unknown as HostNode);

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => jest.restoreAllMocks());

describe("product photos on iPhone", () => {
  beforeEach(() => jest.replaceProperty(Platform, "OS", "ios"));

  it.each(PLACEHOLDERS)("draws the website's %s placeholder itself, with its gradient and text", async (name) => {
    fetchMock.mockResolvedValue(new Response(placeholder(name), { status: 200, headers: { "Content-Type": "image/svg+xml" } }));
    await render(<ProductImage uri={url(name)} accessibilityLabel="Photo" />);
    await waitFor(() => expect(rendered().has("RNSVGText")).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(url(name));
    const types = rendered();
    for (const part of ["RNSVGSvgView", "RNSVGLinearGradient", "RNSVGRect", "RNSVGPath"]) expect(types.has(part)).toBe(true);
    // Not handed to expo-image (Apple's CoreSVG), and not the fallback.
    expect(types.has("ViewManagerAdapter_ExpoImage")).toBe(false);
    expect(screen.queryByText("DODANA")).toBeNull();
  });

  it("shows the DODANA fallback when the SVG can't be loaded", async () => {
    fetchMock.mockResolvedValue(new Response("Not found", { status: 404 }));
    await render(<ProductImage uri={url("bags")} accessibilityLabel="Photo" />);
    expect(await screen.findByText("DODANA")).toBeTruthy();
    expect(rendered().has("RNSVGSvgView")).toBe(false);
  });

  it("keeps photos (JPG, PNG, WebP) on expo-image", async () => {
    await render(<ProductImage uri="http://192.168.1.20:4010/categories/bags.jpg" accessibilityLabel="Photo" />);
    expect(rendered().has("ViewManagerAdapter_ExpoImage")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("product photos elsewhere", () => {
  it("leaves SVG files to expo-image on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await render(<ProductImage uri={url("bags")} accessibilityLabel="Photo" />);
    expect(rendered().has("ViewManagerAdapter_ExpoImage")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("isSvgUrl", () => {
  it("recognises SVG addresses by their file name only", () => {
    expect(isSvgUrl("http://h/placeholders/bags.svg")).toBe(true);
    expect(isSvgUrl("http://h/placeholders/bags.svg?v=2")).toBe(true);
    expect(isSvgUrl("http://h/placeholders/BAGS.SVG")).toBe(true);
    expect(isSvgUrl("http://h/uploads/bags.svg.jpg")).toBe(false);
    expect(isSvgUrl("http://h/svg/bags.png")).toBe(false);
    expect(isSvgUrl("http://h/categories/bags.jpg")).toBe(false);
  });
});
