/**
 * Phase 3 Architecture Boundary Check
 *
 * Developer verification only — no product side effects.
 *   npm run phase3:check
 *
 * Exit 0 = pass (warnings allowed)
 * Exit 1 = violation
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

type CheckResult = { level: "pass" | "warn" | "fail"; message: string };

const results: CheckResult[] = [];

function pass(message: string) {
  results.push({ level: "pass", message });
}
/** Reserved for non-blocking findings (currently unused; Legacy UTC is PASS). */
function warn(message: string) {
  results.push({ level: "warn", message });
}
void warn;
function fail(message: string) {
  results.push({ level: "fail", message });
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function readText(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function walk(
  dir: string,
  exts: Set<string>,
  out: string[] = [],
): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, exts, out);
    } else if (exts.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function rel(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function collectAppSources(): string[] {
  const exts = new Set([".ts", ".tsx", ".sql"]);
  const files = [
    ...walk(path.join(ROOT, "app"), exts),
    ...walk(path.join(ROOT, "components"), exts),
    ...walk(path.join(ROOT, "lib"), exts),
    ...walk(path.join(ROOT, "scripts"), exts),
    ...walk(path.join(ROOT, "supabase"), exts),
  ];
  const pkg = path.join(ROOT, "package.json");
  if (fs.existsSync(pkg)) files.push(pkg);
  return files;
}

// --- Forbidden patterns ---

function checkForbiddenRoutes() {
  if (exists("app/companion")) {
    fail("app/companion/** route directory exists");
  } else {
    pass("no /companion route");
  }

  const appFiles = walk(path.join(ROOT, "app"), new Set([".ts", ".tsx"]));
  const companionHref = appFiles.some((f) => {
    const t = fs.readFileSync(f, "utf8");
    return /href\s*=\s*["'`]\/companion["'`]|["'`]\/companion["'`]/.test(t);
  });
  if (companionHref) {
    fail("application code references /companion href");
  }
}

function checkAiComponents() {
  const forbidden = [
    "AIButton",
    "AIInput",
    "AIForm",
    "AIItemCard",
    "AITripCard",
    "AIConfirmDialog",
  ];
  const files = collectAppSources().filter((f) => !f.endsWith(".sql"));
  const hits: string[] = [];
  for (const f of files) {
    // Skip this scanner and verify scripts mentioning names as strings
    const r = rel(f);
    if (r.startsWith("scripts/phase3-boundary-check")) continue;
    const text = fs.readFileSync(f, "utf8");
    for (const name of forbidden) {
      if (new RegExp(`\\b${name}\\b`).test(text)) {
        hits.push(`${name} in ${r}`);
      }
    }
  }
  if (hits.length) {
    fail(`AI component family: ${hits.join("; ")}`);
  } else {
    pass("no AI component family");
  }
}

function checkConversationDb() {
  const sqlFiles = walk(path.join(ROOT, "supabase"), new Set([".sql"]));
  const patterns = [
    /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?conversations\b/i,
    /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?messages\b/i,
    /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?chat_history\b/i,
    /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?chat_messages\b/i,
  ];
  const hits: string[] = [];
  for (const f of sqlFiles) {
    const text = fs.readFileSync(f, "utf8");
    for (const re of patterns) {
      if (re.test(text)) hits.push(rel(f));
    }
  }
  if (hits.length) {
    fail(`conversation / chat history tables: ${[...new Set(hits)].join(", ")}`);
  } else {
    pass("no conversation database");
  }
}

function checkAiDependencies() {
  const pkg = JSON.parse(readText("package.json")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const all = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };
  const banned = [
    "openai",
    "@openai/",
    "anthropic",
    "@anthropic-ai/",
    "@ai-sdk/",
    "ai",
    "langchain",
    "@langchain/",
    "tesseract",
    "tesseract.js",
    "whisper",
    "@google-cloud/speech",
    "assemblyai",
    "deepgram",
  ];
  const hits = Object.keys(all).filter((name) =>
    banned.some(
      (b) =>
        name === b ||
        name.startsWith(b) ||
        (b.endsWith("/") && name.startsWith(b.slice(0, -1))),
    ),
  );
  // "ai" alone is too broad if matched wrong — check exact
  const filtered = hits.filter((name) => {
    if (name === "ai") return true;
    return banned.some((b) => name === b || name.startsWith(b));
  });
  if (filtered.length) {
    fail(`OCR/STT/LLM dependency: ${filtered.join(", ")}`);
  } else {
    pass("no LLM / OCR / STT dependency");
  }
}

function checkHistoryIsolation() {
  const historyDir = path.join(ROOT, "lib", "history");
  const workflowDir = path.join(ROOT, "lib", "workflows", "historical-search");

  if (!fs.existsSync(historyDir)) {
    pass("lib/history not present yet (isolation N/A)");
  } else {
    const files = walk(historyDir, new Set([".ts", ".tsx"]));
    const importSearch = files.filter((f) => {
      const t = fs.readFileSync(f, "utf8");
      return /from\s+["']@\/lib\/search/.test(t) || /from\s+["']\.\.\/search/.test(t);
    });
    if (importSearch.length) {
      fail(
        `lib/history imports lib/search: ${importSearch.map(rel).join(", ")}`,
      );
    } else {
      pass("lib/history isolated from lib/search");
    }
  }

  if (!fs.existsSync(workflowDir)) {
    pass("historical-search workflow not present yet (write isolation N/A)");
  } else {
    const files = walk(workflowDir, new Set([".ts", ".tsx"]));
    const writeHits = files.filter((f) => {
      const t = fs.readFileSync(f, "utf8");
      return (
        /\bcreateItem\b/.test(t) ||
        /\bupdateItem\b/.test(t) ||
        /\bdeleteItem\b/.test(t) ||
        /from\s+["']@\/lib\/items\/mutations["']/.test(t)
      );
    });
    if (writeHits.length) {
      fail(
        `history workflow imports/writes items: ${writeHits.map(rel).join(", ")}`,
      );
    } else {
      pass("historical-search workflow is read-only (no item mutations)");
    }
  }
}

function checkAgentDirectWrite() {
  const agentDirs = [
    path.join(ROOT, "lib", "agent"),
    path.join(ROOT, "lib", "agents"),
  ];
  let found = false;
  for (const dir of agentDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = walk(dir, new Set([".ts", ".tsx"]));
    for (const f of files) {
      const t = fs.readFileSync(f, "utf8");
      if (
        /from\s+["']@\/lib\/items\/mutations["']/.test(t) ||
        /\.from\(\s*["']items["']\s*\)\s*\.insert/.test(t)
      ) {
        fail(`Agent → DB direct write pattern in ${rel(f)}`);
        found = true;
      }
    }
  }
  if (!found) {
    pass("no Agent → DB direct write module");
  }
}

// --- Required baseline ---

function checkRequiredBaseline() {
  const required = [
    "docs/phase3-current-state.md",
    "components/companion/CompanionHost.tsx",
    "components/companion/CompanionLauncher.tsx",
    "components/companion/CompanionSurface.tsx",
    "lib/companion/draft-storage.ts",
    "lib/companion/task-storage.ts",
    "lib/quantity.ts",
    "lib/receipts/types.ts",
    "lib/receipts/mutations.ts",
    "supabase/migrations/20261001180000_phase3_data_foundation.sql",
  ];

  for (const r of required) {
    if (exists(r)) pass(`exists ${r}`);
    else fail(`missing required ${r}`);
  }

  if (exists("lib/workflows")) pass("exists lib/workflows");
  else fail("missing lib/workflows");

  const migration = exists("supabase/migrations/20261001180000_phase3_data_foundation.sql")
    ? readText("supabase/migrations/20261001180000_phase3_data_foundation.sql")
    : "";
  if (migration.includes("receipt_items") && migration.includes("quantity")) {
    pass("migration includes quantity + receipt_items");
  } else if (migration) {
    fail("phase3 migration missing quantity or receipt_items");
  }

  const legacySrc = exists("lib/todos/legacy-boundary.ts")
    ? readText("lib/todos/legacy-boundary.ts")
    : "";
  if (
    legacySrc.includes('FMN_LEGACY_TODO_BOUNDARY_UTC_ISO') &&
    legacySrc.includes("2026-10-02T00:00:00.000Z")
  ) {
    pass("Legacy Boundary fixed UTC constant present");
  } else {
    fail("Legacy Boundary fixed UTC constant missing");
  }
}

// --- Run ---

checkForbiddenRoutes();
checkAiComponents();
checkConversationDb();
checkAiDependencies();
checkHistoryIsolation();
checkAgentDirectWrite();
checkRequiredBaseline();

const passes = results.filter((r) => r.level === "pass");
const warns = results.filter((r) => r.level === "warn");
const fails = results.filter((r) => r.level === "fail");

console.log("\nPhase 3 Boundary Check\n");

if (passes.length) {
  console.log("PASS:\n");
  for (const r of passes) console.log(`✓ ${r.message}`);
  console.log("");
}
if (warns.length) {
  console.log("WARN:\n");
  for (const r of warns) console.log(`! ${r.message}`);
  console.log("");
}
if (fails.length) {
  console.log("FAIL:\n");
  for (const r of fails) console.log(`✗ ${r.message}`);
  console.log("");
}

console.log(
  `Summary: ${passes.length} pass, ${warns.length} warn, ${fails.length} fail\n`,
);

process.exit(fails.length > 0 ? 1 : 0);
