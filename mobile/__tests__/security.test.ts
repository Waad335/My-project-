import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Everything in the app is public: a value bundled into an app can be
// extracted from it. These checks keep server secrets — and the habit of
// reading arbitrary environment variables — out of the mobile project.

const ROOT = join(__dirname, "..");
const SKIP_DIRS = new Set(["node_modules", ".expo", "dist", "web-build", "coverage", "ios", "android"]);
const THIS_FILE = relative(ROOT, __filename);

function projectFiles(dir = ROOT): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return SKIP_DIRS.has(name) ? [] : projectFiles(full);
    return /\.(png|jpg|jpeg|gif|webp|ttf|otf)$/i.test(name) || name === "package-lock.json" ? [] : [full];
  });
}

// Built from fragments so this file never contains the names it looks for.
const join2 = (...parts: string[]) => parts.join("");
const FORBIDDEN = [
  join2("DATABASE", "_URL"),
  join2("DIRECT", "_URL"),
  join2("SUPABASE", "_SERVICE_ROLE"),
  join2("service", "_role"),
  join2("NEXTAUTH", "_SECRET"),
  join2("CUSTOMER_AUTH", "_SECRET"),
  join2("PAYMOB", "_"),
  join2("RESEND", "_API_KEY"),
  join2("INSTAGRAM_APP", "_SECRET"),
  join2("ADMIN", "_PASSWORD"),
  join2("ADMIN", "_EMAIL"),
  join2("postgres", "://"),
  join2("postgresql", "://"),
  join2("sb_", "secret_"),
];

describe("mobile project secrets guard", () => {
  const files = projectFiles().filter((file) => relative(ROOT, file) !== THIS_FILE);

  it("scans the project", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("contains no server-only variable names, database URLs or service keys", () => {
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const needle of FORBIDDEN) {
        if (text.toLowerCase().includes(needle.toLowerCase())) hits.push(`${relative(ROOT, file)}: ${needle}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("reads no environment variable except EXPO_PUBLIC_API_URL", () => {
    const used = new Set<string>();
    for (const file of files.filter((f) => /\.(ts|tsx|js|mjs|cjs)$/.test(f))) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) used.add(match[1]!);
      expect(text).not.toMatch(/process\.env\[/);
    }
    expect([...used]).toEqual(["EXPO_PUBLIC_API_URL"]);
  });

  it("documents only that one variable in .env.example", () => {
    const example = readFileSync(join(ROOT, ".env.example"), "utf8");
    const names = example
      .split("\n")
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => line.split("=")[0]);
    expect(names).toEqual(["EXPO_PUBLIC_API_URL"]);
  });

  it("keeps local .env files out of git", () => {
    const ignore = readFileSync(join(ROOT, ".gitignore"), "utf8").split("\n");
    expect(ignore).toContain(".env");
    expect(ignore).toContain(".env*.local");
  });
});
