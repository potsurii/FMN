/**
 * Batch 1 verification tests — run with:
 *   npx --yes tsx scripts/batch1-verify.ts
 *
 * No test framework dependency; Node assert only.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  isExplicitConfirmIntent,
  NON_CONFIRM_PHRASES_FOR_TEST,
} from "../lib/companion/confirm-intent";
import {
  buildShoppingRecordDraftFromText,
  getShoppingRecordDraftMissing,
} from "../lib/workflows/record-input/text-parse";
import {
  normalizeQuantity,
  parseQuantity,
  quantityErrorMessage,
} from "../lib/quantity";
import {
  getLegacyTodoBoundaryUtc,
  classifyTodoLegacy,
  FMN_LEGACY_TODO_BOUNDARY_UTC_ISO,
} from "../lib/todos/legacy-boundary";
import { validateTodoForm } from "../lib/todos/validation";

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

section("Quantity");
assert.equal(parseQuantity(1), 1);
assert.equal(parseQuantity(0), null);
assert.equal(parseQuantity(1.5), null);
assert.equal(parseQuantity("3"), 3);
assert.equal(normalizeQuantity(undefined), 1);
assert.ok(quantityErrorMessage("0"));

section("Legacy boundary — approved fixed UTC");
assert.equal(getLegacyTodoBoundaryUtc(), "2026-10-02T00:00:00.000Z");
assert.equal(FMN_LEGACY_TODO_BOUNDARY_UTC_ISO, "2026-10-02T00:00:00.000Z");
assert.equal(classifyTodoLegacy("2026-10-01T23:59:59.999Z"), "legacy");
assert.equal(classifyTodoLegacy("2026-10-02T00:00:00.000Z"), "new");
assert.equal(classifyTodoLegacy("2026-10-02T00:00:00.001Z"), "new");
assert.equal(classifyTodoLegacy("not-a-date"), "unknown");
assert.equal(classifyTodoLegacy(""), "unknown");


section("New Todo required reference fields (create)");
{
  const bad = validateTodoForm(
    {
      name: "Anessa",
      category: "",
      referencePrice: "",
      referenceCurrency: "THB",
      referenceLocation: "",
      note: "",
      quantity: "1",
    },
    { requireReferenceFields: true },
  );
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.ok(bad.errors.referencePrice);
    assert.ok(bad.errors.referenceLocation);
  }

  const good = validateTodoForm(
    {
      name: "Anessa",
      category: "beauty",
      referencePrice: "450",
      referenceCurrency: "THB",
      referenceLocation: "CentralWorld",
      note: "",
      quantity: "2",
    },
    { requireReferenceFields: true },
  );
  assert.equal(good.ok, true);
  if (good.ok) assert.equal(good.data.quantity, 2);
}

section("Legacy edit allows incomplete reference fields");
{
  const ok = validateTodoForm(
    {
      name: "Old todo",
      category: "",
      referencePrice: "",
      referenceCurrency: "",
      referenceLocation: "",
      note: "",
      quantity: "1",
    },
    { requireReferenceFields: false },
  );
  assert.equal(ok.ok, true);
}

section("Explicit Confirm — non-confirm phrases");
for (const phrase of NON_CONFIRM_PHRASES_FOR_TEST) {
  assert.equal(
    isExplicitConfirmIntent(phrase),
    false,
    `"${phrase}" must not confirm`,
  );
}
assert.equal(isExplicitConfirmIntent("继续"), false);
assert.equal(isExplicitConfirmIntent("看起来不错"), false);
assert.equal(isExplicitConfirmIntent("帮我保存"), true);
assert.equal(isExplicitConfirmIntent("确认写入"), true);

section("F3-01 text parse — no guessing name/location");
{
  const draft = buildShoppingRecordDraftFromText("昨天买了东西花了 100 THB", {
    tripId: null,
    tripLabel: null,
  });
  assert.equal(draft.name, "");
  assert.equal(draft.location, "");
  assert.equal(draft.currency, "THB");
  assert.equal(draft.price, 100);
  assert.equal(draft.tripId, null);
  const missing = getShoppingRecordDraftMissing(draft);
  assert.equal(missing.complete, false);
  assert.ok(missing.missing.includes("Trip"));
  assert.ok(missing.missing.includes("商品名称"));
}

{
  const draft = buildShoppingRecordDraftFromText(
    "商品名称：Anessa，价格 450 THB，购买地点：Siam",
    {
      tripId: "trip-1",
      tripLabel: "Bangkok",
      tripStartDate: "2026-01-01",
      tripEndDate: "2026-12-31",
    },
  );
  assert.equal(draft.name, "Anessa");
  assert.equal(draft.location, "Siam");
  assert.equal(draft.tripId, "trip-1");
  assert.equal(draft.price, 450);
  assert.equal(draft.currency, "THB");
  const missing = getShoppingRecordDraftMissing(draft);
  assert.equal(missing.complete, true);
}

section("F3-01 text parse — must not guess price from bare digits");
{
  const cases: Array<{ input: string; expectPrice: number | null; expectName?: string }> = [
    { input: "商品名称：iPhone 15", expectPrice: null, expectName: "iPhone 15" },
    { input: "商品名称：Dior 30", expectPrice: null, expectName: "Dior 30" },
    {
      input: "商品名称：防晒霜，数量：3",
      expectPrice: null,
      expectName: "防晒霜",
    },
    {
      input: "商品名称：防晒霜，日期：2026-10-01",
      expectPrice: null,
      expectName: "防晒霜",
    },
    {
      input: "商品名称：防晒霜，价格不清楚",
      expectPrice: null,
      expectName: "防晒霜",
    },
    { input: "商品名称：防晒霜，15", expectPrice: null, expectName: "防晒霜" },
    { input: "随便写点文字没有金额", expectPrice: null },
    { input: "", expectPrice: null },
  ];

  for (const c of cases) {
    const draft = buildShoppingRecordDraftFromText(c.input, {
      tripId: null,
      tripLabel: null,
    });
    assert.equal(
      draft.price,
      c.expectPrice,
      `price for "${c.input}"`,
    );
    assert.equal(draft.sourceText, c.input.trim(), `sourceText for "${c.input}"`);
    if (c.expectName !== undefined) {
      assert.equal(draft.name, c.expectName, `name for "${c.input}"`);
    }
  }

  // Quantity must still parse without becoming price.
  {
    const draft = buildShoppingRecordDraftFromText("商品名称：防晒霜，数量：3", {
      tripId: null,
      tripLabel: null,
    });
    assert.equal(draft.quantity, 3);
    assert.equal(draft.price, null);
  }
}

section("F3-01 text parse — explicit paid price still extracts");
{
  const yen = buildShoppingRecordDraftFromText(
    "商品名称：防晒霜，实付：1200 日元",
    { tripId: null, tripLabel: null },
  );
  assert.equal(yen.sourceText, "商品名称：防晒霜，实付：1200 日元");
  assert.equal(yen.name, "防晒霜");
  assert.equal(yen.price, 1200);
  assert.equal(yen.currency, "JPY");

  const baht = buildShoppingRecordDraftFromText(
    "商品名称：防晒霜，花了 ฿350",
    { tripId: null, tripLabel: null },
  );
  assert.equal(baht.sourceText, "商品名称：防晒霜，花了 ฿350");
  assert.equal(baht.name, "防晒霜");
  assert.equal(baht.price, 350);
  assert.equal(baht.currency, "THB");
}

section("Confirm write entry is isolated module");
{
  const src = fs.readFileSync(
    path.join(process.cwd(), "lib/workflows/record-input/confirm-write.ts"),
    "utf8",
  );
  assert.ok(src.includes('"use server"'));
  assert.ok(src.includes("export async function confirmShoppingRecordWrite"));
  assert.ok(src.includes("auth.getUser"));
  assert.ok(src.includes("user_id !== user.id"));
}

console.log("\nAll Batch 1 verification assertions passed.\n");
