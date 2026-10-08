/**
 * Batch 2A verification — F3-02 own-history foundation.
 *   npm run test:batch2a
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  classifyCompanionIntent,
  parseOwnHistoryQuery,
} from "../lib/workflows/historical-search/parse-query";
import { sanitizeHistoryTerm, toHistoryIlikePattern } from "../lib/history/sanitize";
import { OWN_HISTORY_LIMIT } from "../lib/history/types";

const ROOT = path.resolve(__dirname, "..");

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

section("Sanitize isolated (no lib/search import)");
assert.equal(sanitizeHistoryTerm("  Anessa%_  "), "Anessa");
assert.equal(toHistoryIlikePattern("Anessa"), "%Anessa%");

section("Intent classification");
assert.equal(classifyCompanionIntent("查 Anessa"), "history");
assert.equal(classifyCompanionIntent("买过防晒吗"), "history");
assert.equal(classifyCompanionIntent("查询我的记录"), "history");
assert.equal(
  classifyCompanionIntent("商品名称：Anessa，价格 450 THB"),
  "record",
);
assert.equal(
  classifyCompanionIntent("查一下并录入商品名称：测试"),
  "ambiguous",
);

section("Allowed parser fields");
{
  const r = parseOwnHistoryQuery("查 Anessa");
  assert.equal(r.status, "ok");
  if (r.status === "ok") {
    assert.equal(r.query.name?.toLowerCase(), "anessa");
  }
}
{
  const r = parseOwnHistoryQuery("买过防晒吗");
  assert.equal(r.status, "ok");
  if (r.status === "ok") {
    assert.equal(r.query.category, "beauty");
  }
}
{
  const r = parseOwnHistoryQuery("查询我的记录");
  assert.equal(r.status, "ok");
  if (r.status === "ok") {
    assert.equal(Object.keys(r.query).length, 0);
  }
}

section("最近 parse (L-03 recentTrip)");
{
  const r = parseOwnHistoryQuery("最近买的");
  assert.equal(r.status, "ok");
  if (r.status === "ok") {
    assert.equal(r.query.recentTrip, true);
  }
}

section("Destination / relative trip parse (L-01 Destination)");
{
  const r = parseOwnHistoryQuery("上次去日本买的");
  assert.equal(r.status, "ok");
  if (r.status === "ok") {
    assert.equal(r.query.destination, "日本");
    assert.equal(r.query.relativeDestinationTrip, "latest");
  }
}
{
  const r = parseOwnHistoryQuery("日本买过什么");
  assert.equal(r.status, "ok");
  if (r.status === "ok") {
    assert.equal(r.query.destination, "日本");
    assert.equal(r.query.relativeDestinationTrip, undefined);
  }
}

section("No FX — price without currency asks");
{
  const r = parseOwnHistoryQuery("查价格 450 的东西");
  assert.equal(r.status, "ask");
}
{
  const r = parseOwnHistoryQuery("查价格 450 THB");
  assert.equal(r.status, "ok");
  if (r.status === "ok") {
    assert.equal(r.query.minPrice, 450);
    assert.equal(r.query.maxPrice, 450);
    assert.equal(r.query.currency, "THB");
  }
}
{
  const r = parseOwnHistoryQuery("价格 100");
  // Without history cue and only price — classify may be none; parse should ask for currency
  assert.equal(r.status, "ask");
}

section("Limit constant");
assert.ok(OWN_HISTORY_LIMIT >= 1);

section("lib/history isolated from lib/search");
{
  const historyDir = path.join(ROOT, "lib", "history");
  for (const name of fs.readdirSync(historyDir)) {
    if (!name.endsWith(".ts")) continue;
    const text = fs.readFileSync(path.join(historyDir, name), "utf8");
    assert.equal(
      /from\s+["']@\/lib\/search/.test(text),
      false,
      `${name} must not import lib/search`,
    );
  }
}

section("historical-search workflow has no write imports");
{
  const dir = path.join(ROOT, "lib", "workflows", "historical-search");
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".ts")) continue;
    const text = fs.readFileSync(path.join(dir, name), "utf8");
    assert.equal(/\bcreateItem\b/.test(text), false, `${name} createItem`);
    assert.equal(/\bupdateItem\b/.test(text), false, `${name} updateItem`);
    assert.equal(/\bdeleteItem\b/.test(text), false, `${name} deleteItem`);
    assert.equal(
      /from\s+["']@\/lib\/items\/mutations["']/.test(text),
      false,
      `${name} items/mutations`,
    );
  }
}

section("Required Batch 2A files exist");
for (const rel of [
  "lib/history/types.ts",
  "lib/history/sanitize.ts",
  "lib/history/queries.ts",
  "lib/workflows/historical-search/parse-query.ts",
  "lib/workflows/historical-search/run-search.ts",
  "components/companion/HistoryResultSection.tsx",
  "scripts/phase3-boundary-check.ts",
]) {
  assert.ok(
    fs.existsSync(path.join(ROOT, rel)),
    `missing ${rel}`,
  );
}

console.log("\nAll Batch 2A verification assertions passed.\n");
