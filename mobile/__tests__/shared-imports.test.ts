import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// The app may use exactly these website files, and nothing else from the
// website (no server code, no website dependencies):
// - the English/Arabic text files (bundled);
// - the mobile API's types (type-only imports, erased at build time).
const ALLOWED_SHARED = {
  "@shared/messages/en.json": "../src/messages/en.json",
  "@shared/messages/ar.json": "../src/messages/ar.json",
  "@shared/api-types": "../src/lib/mobile/types.ts",
};

const ROOT = join(__dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return projectDir(name) ? sourceFiles(full) : [];
    return /\.(ts|tsx|js|mjs|cjs)$/.test(name) ? [full] : [];
  });
}
const projectDir = (name: string) => !["node_modules", ".expo", "dist", "coverage", "ios", "android"].includes(name);

const importPattern = /(?:import|export)\s+(type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)/g;

describe("code shared with the website", () => {
  const files = sourceFiles(ROOT);

  it("only imports the approved website files, and the API types only as types", () => {
    const problems: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(importPattern)) {
        const typeOnly = Boolean(match[1]);
        const spec = match[2] ?? match[3] ?? "";
        const where = relative(ROOT, file);
        if (spec.startsWith("@shared/")) {
          if (!(spec in ALLOWED_SHARED)) problems.push(`${where}: ${spec} is not an approved shared file`);
          if (spec === "@shared/api-types" && !typeOnly) problems.push(`${where}: import the API types with "import type"`);
        }
        if (spec.startsWith("../") || spec.startsWith("./")) {
          // Relative imports must stay inside the mobile project.
          const resolved = relative(ROOT, join(file, "..", spec));
          if (resolved.startsWith("..") && !where.startsWith("__tests__")) problems.push(`${where}: ${spec} leaves the mobile project`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("declares exactly the approved aliases in tsconfig.json", () => {
    const tsconfig = readFileSync(join(ROOT, "tsconfig.json"), "utf8");
    const shared = [...tsconfig.matchAll(/"(@shared\/[^"]+)":\s*\["([^"]+)"\]/g)].map(([, alias, target]) => [alias, target]);
    expect(Object.fromEntries(shared)).toEqual(ALLOWED_SHARED);
  });

  it("lets Metro read only the website's text folder", () => {
    const script =
      "const c = require('./metro.config.js'); console.log(JSON.stringify({ root: c.projectRoot, w: c.watchFolders, n: c.resolver.nodeModulesPaths, x: c.resolver.extraNodeModules || {} }))";
    const metro = JSON.parse(execFileSync(process.execPath, ["-e", script], { cwd: ROOT, encoding: "utf8" }).trim().split("\n").pop()!);
    expect(metro.w).toEqual([join(ROOT, "../src/messages")]);
    // No extra places to load packages from (e.g. the website's node_modules).
    expect(metro.n).toEqual([]);
    expect(metro.x).toEqual({});
  });

  it("uses shared files that have no imports of their own", () => {
    const types = readFileSync(join(ROOT, ALLOWED_SHARED["@shared/api-types"]), "utf8");
    expect(types).not.toMatch(/^\s*import\s/m);
    expect(types).not.toMatch(/require\(/);
    for (const locale of ["en", "ar"]) {
      expect(() => JSON.parse(readFileSync(join(ROOT, `../src/messages/${locale}.json`), "utf8"))).not.toThrow();
    }
  });
});
