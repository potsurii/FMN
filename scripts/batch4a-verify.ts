/**
 * Batch 4-A — Receipt Draft Group (pure helpers, no providers).
 *   npm run test:batch4a
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createEmptyShoppingRecordDraft } from "../lib/companion/types";
import {
  addReceiptItemDraft,
  createEmptyReceiptDraftGroup,
  deleteReceiptItemDraft,
  extractionQuantity,
  getReceiptDraftGroupConfirmState,
  receiptDraftGroupFromStructured,
  toReceiptLineExtraction,
  updateReceiptItemDraft,
} from "../lib/workflows/record-input/receipt-draft-group";

const ROOT = path.resolve(__dirname, "..");

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

function item(name: string, id?: string) {
  const draft = createEmptyShoppingRecordDraft({
    sourceText: "",
    tripId: "trip-1",
    tripLabel: "Tokyo",
    purchaseDateDefault: "2026-06-01",
  });
  return {
    ...draft,
    id: id ?? draft.id,
    name,
    price: 1000,
    currency: "JPY",
    location: "store",
    purchaseDate: "2026-06-01",
    quantity: 1,
  };
}

section("one receipt, many item drafts");
{
  let group = createEmptyReceiptDraftGroup();
  group = {
    ...group,
    receiptImageRef: "user/temp/a.png",
    receiptDate: "2026-06-01",
    merchant: "Matsumoto",
  };
  group = addReceiptItemDraft(group, item("A", "a"));
  group = addReceiptItemDraft(group, item("B", "b"));
  assert.equal(group.items.length, 2);
  assert.equal(group.receiptImageRef, "user/temp/a.png");
  assert.equal(group.items[0]?.receiptImageRef, null);
  assert.equal(group.items[1]?.receiptImageRef, null);
}

section("edit one item leaves the other unchanged");
{
  let group = createEmptyReceiptDraftGroup();
  group = addReceiptItemDraft(group, item("A", "a"));
  group = addReceiptItemDraft(group, item("B", "b"));
  const edited = { ...group.items[0]!, name: "A2", price: 20 };
  group = updateReceiptItemDraft(group, "a", edited);
  assert.equal(group.items[0]?.name, "A2");
  assert.equal(group.items[0]?.price, 20);
  assert.equal(group.items[1]?.name, "B");
  assert.equal(group.items[1]?.price, 1000);
}

section("delete one item keeps receipt and the other item");
{
  let group = createEmptyReceiptDraftGroup();
  group = {
    ...group,
    receiptImageRef: "user/temp/keep.png",
    merchant: "Shop",
  };
  group = addReceiptItemDraft(group, item("A", "a"));
  group = addReceiptItemDraft(group, item("B", "b"));
  group = deleteReceiptItemDraft(group, "a");
  assert.equal(group.items.length, 1);
  assert.equal(group.items[0]?.id, "b");
  assert.equal(group.receiptImageRef, "user/temp/keep.png");
  assert.equal(group.merchant, "Shop");
}

section("manual add");
{
  let group = createEmptyReceiptDraftGroup();
  group = addReceiptItemDraft(group, item("Added", "c"));
  assert.equal(group.items.length, 1);
  assert.equal(group.items[0]?.name, "Added");
  assert.equal(group.items[0]?.quantity, 1);
}

section("confirm blocked until items are complete; helpers do not write");
{
  const empty = createEmptyReceiptDraftGroup();
  assert.equal(getReceiptDraftGroupConfirmState(empty).ready, false);
  let group = addReceiptItemDraft(empty, item("Ready", "r"));
  assert.equal(getReceiptDraftGroupConfirmState(group).ready, true);
  const incomplete = createEmptyShoppingRecordDraft({
    sourceText: "",
    tripId: "trip-1",
    tripLabel: "Tokyo",
    purchaseDateDefault: null,
  });
  group = addReceiptItemDraft(group, { ...incomplete, id: "gap", quantity: 1 });
  assert.equal(getReceiptDraftGroupConfirmState(group).ready, false);
}

section("A explicit quantity stays a line price, not a unit price");
{
  const line = toReceiptLineExtraction({
    product_name: "KITKAT",
    receipt_line_price: 900,
    quantity: 3,
  });
  assert.equal(line.product_name, "KITKAT");
  assert.equal(line.receipt_line_price, 900);
  assert.equal(line.quantity, 3);
  const group = receiptDraftGroupFromStructured(
    { items: [line] },
    { tripId: "trip-1", tripLabel: "Tokyo" },
  );
  assert.equal(group.items[0]?.price, 900);
  assert.equal(group.items[0]?.quantity, 3);
  assert.notEqual(group.items[0]?.price, 300);
}

section("B missing extraction quantity stays null");
{
  const line = toReceiptLineExtraction({
    product_name: "KITKAT",
    receipt_line_price: 900,
    quantity: null,
  });
  assert.equal(line.quantity, null);
  assert.equal(extractionQuantity(undefined), null);
  const group = receiptDraftGroupFromStructured(
    { items: [line] },
    { tripId: "trip-1", tripLabel: "Tokyo" },
  );
  assert.equal(group.items[0]?.price, 900);
  assert.equal(group.items[0]?.quantity, 1);
  assert.equal(group.items[0]?.purchaseDate, null);
}

section("C-G line price is not derived from total, discount, tax, or refund");
{
  const lines = [
    toReceiptLineExtraction({
      product_name: "A",
      receipt_line_price: 900,
      quantity: null,
    }),
    toReceiptLineExtraction({
      product_name: "B",
      receipt_line_price: 500,
      quantity: null,
    }),
  ];
  const group = receiptDraftGroupFromStructured(
    {
      merchant: "Shop",
      receiptDate: "2026-06-02",
      items: lines,
    },
    { tripId: "trip-1", tripLabel: "Tokyo" },
  );
  assert.equal(group.items[0]?.price, 900);
  assert.equal(group.items[1]?.price, 500);
  assert.notEqual(group.items[0]?.price, 1400);
  const discounted = toReceiptLineExtraction({
    product_name: "Item",
    receipt_line_price: 1000,
    quantity: null,
  });
  assert.equal(discounted.receipt_line_price, 1000);
  assert.notEqual(discounted.receipt_line_price, 800);
  assert.equal(getReceiptDraftGroupConfirmState(group).ready, false);
}

section("H extraction does not write items.price");
{
  const text = fs.readFileSync(
    path.join(ROOT, "lib/workflows/record-input/receipt-draft-group.ts"),
    "utf8",
  );
  assert.doesNotMatch(text, /supabase/i);
  assert.doesNotMatch(text, /\.insert\(|\.update\(|\.delete\(/);
  assert.doesNotMatch(text, /receipt_line_price\s*\/\s*quantity/);
  assert.match(text, /receipt_line_price/);
  assert.doesNotMatch(text, /StructuredReceiptItem/);
}

section("no provider, tax allocator, or direct DB write in the helper");
{
  const text = fs.readFileSync(
    path.join(ROOT, "lib/workflows/record-input/receipt-draft-group.ts"),
    "utf8",
  );
  assert.doesNotMatch(text, /supabase/i);
  assert.doesNotMatch(text, /tesseract|whisper|openai|langchain/i);
  assert.doesNotMatch(text, /tax/i);
  assert.doesNotMatch(text, /\.from\(/);
  const ui = fs.readFileSync(
    path.join(ROOT, "components/companion/ReceiptDraftGroupReview.tsx"),
    "utf8",
  );
  assert.match(ui, /RecordDraftReview/);
  assert.match(ui, /ImageUploader/);
  const host = fs.readFileSync(
    path.join(ROOT, "components/companion/CompanionHost.tsx"),
    "utf8",
  );
  assert.match(host, /confirmBatchShoppingWrite/);
  assert.doesNotMatch(
    host,
    /receiptGroup[\s\S]{0,400}confirmShoppingRecordWrite/,
  );
}

console.log("\nBatch 4-A verify passed.\n");
