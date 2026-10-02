/**
 * FMN Architecture Scan — lightweight structural inventory only.
 * Does NOT parse TS AST or inspect business logic.
 *
 *   npm run architecture:scan
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

type DirStat = { path: string; files: number; dirs: string[] };

function listDirs(rel: string): string[] {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function countFiles(rel: string, exts: Set<string>): number {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return 0;
  let n = 0;
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (exts.has(path.extname(entry.name))) n += 1;
    }
  };
  walk(full);
  return n;
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".sql", ".md", ".mdc"]);

const roots = [
  "app",
  "components",
  "lib",
  "docs",
  "scripts",
  "supabase",
  "public",
  ".cursor",
];

console.log("\nFMN Architecture Scan (structural only)\n");

const stats: DirStat[] = roots.map((r) => ({
  path: r,
  files: countFiles(r, CODE_EXTS),
  dirs: listDirs(r),
}));

for (const s of stats) {
  console.log(
    `${s.path.padEnd(12)} files≈${String(s.files).padStart(3)}  sub=[${s.dirs.join(", ")}]`,
  );
}

console.log("\nKey markers:\n");
const markers = [
  "middleware.ts",
  "app/page.tsx",
  "app/search/page.tsx",
  "components/companion/CompanionHost.tsx",
  "lib/search/queries.ts",
  "lib/history/queries.ts",
  "lib/workflows/record-input/confirm-write.ts",
  "lib/workflows/historical-search/run-search.ts",
  "supabase/migrations/20261001180000_phase3_data_foundation.sql",
  "docs/phase3-current-state.md",
  "docs/fmn-architecture-map.md",
  "scripts/phase3-boundary-check.ts",
];
for (const m of markers) {
  console.log(`  ${exists(m) ? "✓" : "·"} ${m}`);
}

console.log("\nApp routes (page.tsx):\n");
function findPages(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) findPages(p, out);
    else if (entry.name === "page.tsx") {
      out.push(path.relative(ROOT, path.dirname(p)).replace(/\\/g, "/"));
    }
  }
  return out;
}
for (const r of findPages(path.join(ROOT, "app")).sort()) {
  console.log(`  /${r === "app" ? "" : r.replace(/^app\/?/, "")}`);
}

console.log("\nMigrations:\n");
const migDir = path.join(ROOT, "supabase", "migrations");
if (fs.existsSync(migDir)) {
  for (const f of fs.readdirSync(migDir).filter((x) => x.endsWith(".sql")).sort()) {
    console.log(`  ${f}`);
  }
}

console.log("\nDone.\n");
