/**
 * Batch 2B verification — Legacy Boundary UTC + F3-03 Organize + F3-04 Todo formal.
 *   npm run test:batch2b
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  classifyTodoLegacy,
  FMN_LEGACY_TODO_BOUNDARY_UTC_ISO,
} from "../lib/todos/legacy-boundary";
import { classifyCompanionIntent } from "../lib/workflows/historical-search/parse-query";
import {
  aggregateByCurrency,
  buildOrganizeResult,
} from "../lib/workflows/organize/compute";
import {
  extractOrganizePriceFilter,
  parseOrganizeQuery,
} from "../lib/workflows/organize/parse-query";
import type { OrganizeSpec } from "../lib/workflows/organize/types";
import {
  buildShoppingTodoDraftFromText,
  getShoppingTodoDraftMissing,
  hasNonConcretePriceSemantics,
} from "../lib/workflows/todo-planning/text-parse";
import type { ItemWithDisplay } from "../lib/items/types";

const ROOT = path.resolve(__dirname, "..");

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function assertNoImport(source: string, forbidden: string, label: string) {
  const re = new RegExp(
    `from\\s+["']${forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  );
  assert.equal(re.test(source), false, `${label} must not import ${forbidden}`);
}

// --- Step 0: Legacy Boundary ---
section("Legacy Boundary UTC fixed constant");
assert.equal(FMN_LEGACY_TODO_BOUNDARY_UTC_ISO, "2026-10-02T00:00:00.000Z");

section("classifyTodoLegacy boundary four-state + invalid");
assert.equal(
  classifyTodoLegacy("2026-10-01T23:59:59.999Z"),
  "legacy",
);
assert.equal(classifyTodoLegacy("2026-10-02T00:00:00.000Z"), "new");
assert.equal(classifyTodoLegacy("2026-10-02T00:00:00.001Z"), "new");
assert.equal(classifyTodoLegacy("not-a-date"), "unknown");
assert.equal(classifyTodoLegacy(""), "unknown");

section("Migration records boundary (comment only)");
{
  const mig = read(
    "supabase/migrations/20261002120000_phase3_todo_legacy_boundary.sql",
  );
  assert.match(mig, /2026-10-02T00:00:00\.000Z/);
  // Comment may mention "NOT NULL" as forbidden; ensure no schema-altering NOT NULL.
  assert.doesNotMatch(mig, /alter\s+table/i);
  assert.doesNotMatch(mig, /add\s+column/i);
  assert.doesNotMatch(mig, /update\s+public\.shopping_todos/i);
  assert.match(mig, /comment on table public\.shopping_todos/i);
}

// --- Intent ---
section("Intent: organize / todo");
assert.equal(classifyCompanionIntent("按货币分别统计总花费"), "organize");
assert.equal(classifyCompanionIntent("帮我按分类整理我买过的美妆"), "organize");
assert.equal(classifyCompanionIntent("列出我买过的日用品"), "organize");
assert.equal(
  classifyCompanionIntent("帮我加一个 Anessa，3000 日元，在松本清买"),
  "todo",
);
assert.equal(classifyCompanionIntent("查 Anessa"), "history");

// --- Organize ---
section("Organize parse: L-03 / L-01 blocked");
{
  const r = parseOrganizeQuery("帮我整理最近的购物");
  assert.equal(r.status, "blocked");
  if (r.status === "blocked") assert.equal(r.code, "L-03");
}
{
  const r = parseOrganizeQuery("帮我整理去年在日本的购物");
  assert.equal(r.status, "blocked");
  if (r.status === "blocked") assert.equal(r.code, "L-01");
}

section("Organize Brand intent (牌子/品牌 cues) → L-01 unsupported");
{
  const r = parseOrganizeQuery("整理资生堂牌子的购物");
  assert.equal(r.status, "blocked");
  if (r.status === "blocked") assert.equal(r.code, "L-01");
}
{
  const r = parseOrganizeQuery("买过的资生堂品牌");
  assert.equal(r.status, "blocked");
  if (r.status === "blocked") assert.equal(r.code, "L-01");
}
{
  // Must not silently become ok with empty brand-agnostic broaden-as-success for 牌子 cue
  const r = parseOrganizeQuery("资生堂牌子");
  assert.notEqual(r.status, "ok");
}
{
  // Destination / 最近 unchanged
  const dest = parseOrganizeQuery("帮我整理日本的购物");
  assert.equal(dest.status, "blocked");
  if (dest.status === "blocked") assert.equal(dest.code, "L-01");
  const recent = parseOrganizeQuery("整理最近买的美妆");
  assert.equal(recent.status, "blocked");
  if (recent.status === "blocked") assert.equal(recent.code, "L-03");
}

section("Organize explicit price filter (M1)");
{
  const lower = parseOrganizeQuery("整理价格高于 3000 日元的记录");
  assert.equal(lower.status, "ok");
  if (lower.status === "ok") {
    assert.equal(lower.spec.filter.minPrice, 3000);
    assert.equal(lower.spec.filter.currency, "JPY");
    assert.equal(lower.spec.filter.maxPrice, undefined);
  }
}
{
  const upper = parseOrganizeQuery("整理价格低于 3000 日元的记录");
  assert.equal(upper.status, "ok");
  if (upper.status === "ok") {
    assert.equal(upper.spec.filter.maxPrice, 3000);
    assert.equal(upper.spec.filter.currency, "JPY");
    assert.equal(upper.spec.filter.minPrice, undefined);
  }
}
{
  const range = parseOrganizeQuery("整理价格在 2000-5000 日元之间的记录");
  assert.equal(range.status, "ok");
  if (range.status === "ok") {
    assert.equal(range.spec.filter.minPrice, 2000);
    assert.equal(range.spec.filter.maxPrice, 5000);
    assert.equal(range.spec.filter.currency, "JPY");
  }
}
{
  const within = parseOrganizeQuery("整理 3000 日元以内的购物");
  assert.equal(within.status, "ok");
  if (within.status === "ok") {
    assert.equal(within.spec.filter.maxPrice, 3000);
    assert.equal(within.spec.filter.currency, "JPY");
  }
}
{
  const below = extractOrganizePriceFilter("3000 日元以下");
  assert.equal(below.maxPrice, 3000);
  assert.equal(below.currency, "JPY");
}
{
  // Approx must not become exact bounds
  const approx1 = extractOrganizePriceFilter("预算 3000 日元");
  assert.equal(approx1.minPrice, undefined);
  assert.equal(approx1.maxPrice, undefined);
  const approx2 = extractOrganizePriceFilter("大概 3000 日元");
  assert.equal(approx2.minPrice, undefined);
  assert.equal(approx2.maxPrice, undefined);
  const approx3 = extractOrganizePriceFilter("3000 日元左右");
  assert.equal(approx3.minPrice, undefined);
  assert.equal(approx3.maxPrice, undefined);
}

section("Organize: Record Count ≠ Quantity; per-currency totals");
{
  const items: ItemWithDisplay[] = [
    {
      id: "1",
      tripId: "t1",
      name: "A",
      price: 100,
      currency: "THB",
      location: "x",
      purchaseDate: "2026-01-01",
      category: "beauty",
      note: null,
      quantity: 2,
      imagePath: null,
      imageUrl: null,
      visibility: "private",
    },
    {
      id: "2",
      tripId: "t1",
      name: "B",
      price: 50,
      currency: "THB",
      location: "y",
      purchaseDate: "2026-01-02",
      category: "daily",
      note: null,
      quantity: 3,
      imagePath: null,
      imageUrl: null,
      visibility: "private",
    },
    {
      id: "3",
      tripId: "t2",
      name: "C",
      price: 3000,
      currency: "JPY",
      location: "z",
      purchaseDate: "2026-01-03",
      category: "beauty",
      note: null,
      quantity: 1,
      imagePath: null,
      imageUrl: null,
      visibility: "private",
    },
  ];

  const totals = aggregateByCurrency(items);
  assert.equal(totals.length, 2);
  const thb = totals.find((t) => t.currency === "THB");
  const jpy = totals.find((t) => t.currency === "JPY");
  assert.ok(thb && jpy);
  assert.equal(thb!.totalAmount, 150);
  assert.equal(thb!.recordCount, 2);
  assert.equal(thb!.quantitySum, 5);
  assert.equal(jpy!.totalAmount, 3000);
  assert.equal(jpy!.recordCount, 1);
  assert.equal(jpy!.quantitySum, 1);

  // Never a single cross-currency sum field
  const grand = totals.reduce((s, t) => s + t.totalAmount, 0);
  assert.equal(grand, 3150); // accidental numeric sum exists only in test math
  assert.notEqual(thb!.totalAmount + jpy!.totalAmount, thb!.totalAmount); // sanity

  const spec: OrganizeSpec = {
    filter: {},
    groupBy: "currency",
    sortBy: "purchase_date_asc",
    aggregateTotalsByCurrency: true,
    summary: "test",
  };
  const view = buildOrganizeResult(items, spec);
  assert.equal(view.recordCount, 3);
  assert.equal(view.quantitySum, 6);
  assert.notEqual(view.recordCount, view.quantitySum);
  assert.equal(view.totalsByCurrency.length, 2);
  assert.ok(view.groups);
  assert.equal(view.groups!.length, 2);
}

section("Organize workflow must not import lib/search or item mutations");
{
  for (const rel of [
    "lib/workflows/organize/run-organize.ts",
    "lib/workflows/organize/compute.ts",
    "lib/workflows/organize/parse-query.ts",
    "components/companion/OrganizeResultSection.tsx",
  ]) {
    const src = read(rel);
    assertNoImport(src, "@/lib/search", rel);
    assert.doesNotMatch(src, /createItem|updateItem|deleteItem/);
  }
  const historyQueries = read("lib/history/queries.ts");
  assertNoImport(historyQueries, "@/lib/search", "lib/history/queries.ts");
}

// --- Todo formal ---
section("Todo price: concrete ok; budget/approx ask");
{
  const ok = buildShoppingTodoDraftFromText(
    "帮我加一个 Anessa，3000 日元，在松本清买",
    { tripId: "trip-1", tripLabel: "Japan" },
  );
  assert.equal(ok.status, "ok");
  if (ok.status === "ok") {
    assert.equal(ok.draft.name.toLowerCase().includes("anessa"), true);
    assert.equal(ok.draft.referencePrice, 3000);
    assert.equal(ok.draft.referenceCurrency, "JPY");
    assert.match(ok.draft.referenceLocation, /松本清/);
    assert.equal(ok.draft.tripId, "trip-1");
    const { complete, missing } = getShoppingTodoDraftMissing(ok.draft);
    assert.equal(complete, true);
    assert.equal(missing.length, 0);
  }
}
{
  assert.equal(hasNonConcretePriceSemantics("预算 3000 日元"), true);
  assert.equal(hasNonConcretePriceSemantics("大概 3000 日元"), true);
  assert.equal(hasNonConcretePriceSemantics("3000 日元左右"), true);
  assert.equal(hasNonConcretePriceSemantics("3000 日元上下"), true);
  // Unrelated 以下 / 上下 in other clauses must not block
  assert.equal(
    hasNonConcretePriceSemantics("参考以下说明，帮我找 3000 日元的东西"),
    false,
  );
  assert.equal(
    hasNonConcretePriceSemantics("见上下列内容，买 3000 日元"),
    false,
  );
}
{
  const ask = buildShoppingTodoDraftFromText(
    "帮我加一个 Anessa，预算 3000 日元，在松本清买",
    { tripId: "trip-1", tripLabel: "Japan" },
  );
  assert.equal(ask.status, "ask");
}
{
  const ask = buildShoppingTodoDraftFromText(
    "帮我加一个防晒，大概 3000 日元",
    { tripId: null, tripLabel: null },
  );
  assert.equal(ask.status, "ask");
}
{
  const ask = buildShoppingTodoDraftFromText(
    "帮我加一个口红，3000 日元左右",
    { tripId: null, tripLabel: null },
  );
  assert.equal(ask.status, "ask");
}
{
  // Unrelated 以下 must still allow concrete draft
  const ok = buildShoppingTodoDraftFromText(
    "参考以下说明，帮我加一个 Anessa，3000 日元，在松本清买",
    { tripId: "trip-1", tripLabel: "Japan" },
  );
  assert.equal(ok.status, "ok");
  if (ok.status === "ok") {
    assert.equal(ok.draft.referencePrice, 3000);
    assert.equal(ok.draft.referenceCurrency, "JPY");
  }
}

section("Todo missing fields disable completeness");
{
  const partial = buildShoppingTodoDraftFromText("帮我加一个 Anessa", {
    tripId: null,
    tripLabel: null,
  });
  assert.equal(partial.status, "ok");
  if (partial.status === "ok") {
    const { complete, missing } = getShoppingTodoDraftMissing(partial.draft);
    assert.equal(complete, false);
    assert.ok(missing.includes("Trip"));
    assert.ok(missing.some((m) => m.includes("参考价格")));
    assert.ok(missing.some((m) => m.includes("计划购买地点")));
  }
}

section("No /companion route; confirm-write uses createTodo");
{
  assert.equal(fs.existsSync(path.join(ROOT, "app/companion")), false);
  const confirm = read("lib/workflows/todo-planning/confirm-write.ts");
  assert.match(confirm, /createTodo/);
  assert.doesNotMatch(confirm, /createItem/);
}

section("Required Batch 2B files exist");
for (const rel of [
  "lib/todos/legacy-boundary.ts",
  "lib/workflows/organize/types.ts",
  "lib/workflows/organize/compute.ts",
  "lib/workflows/organize/parse-query.ts",
  "lib/workflows/organize/run-organize.ts",
  "lib/workflows/todo-planning/text-parse.ts",
  "lib/workflows/todo-planning/confirm-write.ts",
  "components/companion/OrganizeResultSection.tsx",
  "components/companion/TodoDraftReview.tsx",
]) {
  assert.equal(fs.existsSync(path.join(ROOT, rel)), true, `missing ${rel}`);
}

console.log("\n✅ Batch 2B verification passed\n");
