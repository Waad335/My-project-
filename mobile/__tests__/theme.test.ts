import { readFileSync } from "node:fs";
import { join } from "node:path";
import { palette } from "@/theme/colors";

// The website's tailwind.config.ts is the source of truth for the brand
// colours. This parses its colour block and fails if the app ever drifts.
function websitePalette(): Record<string, Record<string, string>> {
  const source = readFileSync(join(__dirname, "../../tailwind.config.ts"), "utf8");
  const colorsBlock = source.slice(source.indexOf("colors: {") + "colors: {".length, source.indexOf("transitionTimingFunction"));
  const result: Record<string, Record<string, string>> = {};
  for (const match of colorsBlock.matchAll(/(\w+): \{([^}]*)\}/g)) {
    const [, name, body] = match;
    const shades: Record<string, string> = {};
    for (const [, shade, hex] of body!.matchAll(/(DEFAULT|\d+): "(#[0-9A-Fa-f]{6})"/g)) shades[shade!] = hex!.toUpperCase();
    if (Object.keys(shades).length) result[name!] = shades;
  }
  return result;
}

describe("brand colours", () => {
  it("are exactly the website's", () => {
    const website = websitePalette();
    expect(Object.keys(website).sort()).toEqual(Object.keys(palette).sort());
    for (const [name, shades] of Object.entries(palette)) {
      const normalised = Object.fromEntries(Object.entries(shades).map(([k, v]) => [k, v.toUpperCase()]));
      expect(normalised).toEqual(website[name]);
    }
  });
});
