// Guards against drift: every admin API handler and every protected admin
// page must call its server-side guard, with the same permission the
// middleware map (permissionForAdminApi / permissionForAdminPage) expects.
// A new admin route without a guard fails this test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import { permissionForAdminApi, permissionForAdminPage } from "../../src/lib/admin-permissions";

const ROOT = process.cwd();
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function filesNamed(dir: string, name: string): string[] {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .map(String)
    .filter((f) => f.split(sep).pop() === name)
    .map((f) => join(dir, f));
}

// "src/app/api/admin/products/[id]/route.ts" → "/api/admin/products/sample-id"
function urlFor(file: string, base: string, prefix: string): string {
  const rel = file.slice(base.length).split(sep).slice(0, -1);
  const segments = rel.filter((s) => s && !/^\(.*\)$/.test(s)).map((s) => (/^\[.*\]$/.test(s) ? "sample-id" : s));
  return [prefix, ...segments].join("/");
}

test("every /api/admin handler calls requireAdminPermission with the mapped permission", () => {
  const base = join("src", "app", "api", "admin");
  const files = filesNamed(base, "route.ts");
  assert.ok(files.length > 0, "no admin API routes found");
  let handlers = 0;
  for (const file of files) {
    const source = readFileSync(join(ROOT, file), "utf8");
    const url = urlFor(file, base, "/api/admin");
    const parts = source.split(/export async function (GET|POST|PUT|PATCH|DELETE)\b/);
    // parts: [preamble, METHOD, body, METHOD, body, ...]
    for (let i = 1; i < parts.length; i += 2) {
      const method = parts[i]!;
      const body = parts[i + 1]!;
      const guard = body.match(/requireAdminPermission\("([a-z.]+)"\)/);
      assert.ok(guard, `${method} ${url} (${file}) has no requireAdminPermission guard`);
      const expected = permissionForAdminApi(url, method);
      assert.ok(expected, `${method} ${url} is not in the permission map (would be ADMIN-only in middleware)`);
      assert.equal(guard[1], expected, `${method} ${url}: handler guard and middleware map disagree`);
      handlers++;
    }
    for (const m of METHODS) {
      assert.ok(!new RegExp(`export const ${m}\\b`).test(source), `${file}: use "export async function ${m}" so it is checked`);
    }
  }
  assert.ok(handlers >= 29, `expected at least 29 guarded handlers, found ${handlers}`);
});

test("every protected /admin page calls requireAdminPage with the mapped permission", () => {
  const base = join("src", "app", "admin", "(protected)");
  const files = filesNamed(base, "page.tsx");
  assert.ok(files.length > 0, "no admin pages found");
  for (const file of files) {
    const source = readFileSync(join(ROOT, file), "utf8");
    const url = urlFor(file, base, "/admin");
    const guard = source.match(/requireAdminPage\("([a-z.]+)"\)/);
    assert.ok(guard, `${url} (${file}) has no requireAdminPage guard`);
    assert.equal(guard[1], permissionForAdminPage(url), `${url}: page guard and middleware map disagree`);
  }
});
