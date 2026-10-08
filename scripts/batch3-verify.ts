/**
 * Batch 3 verification — I-01 Atomic Batch Confirm + I-02 Receipt Temp Lifecycle
 *   npm run test:batch3
 *
 * Static / unit checks (no live Supabase required).
 * Live RPC rollback / RLS must be validated against a migrated local DB.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  CONFIRM_BATCH_SHOPPING_WRITES_RPC,
} from "../lib/batch/confirm-batch-writes";
import {
  RECEIPT_FORMAL_BUCKET,
  RECEIPT_TEMP_BUCKET,
  RECEIPT_TEMP_TTL_MS,
} from "../lib/storage/receipt-buckets";
import {
  assertOwnedReceiptPath,
  buildFormalReceiptObjectPath,
  buildTempReceiptObjectPath,
  isTempReceiptExpired,
} from "../lib/storage/receipt-lifecycle";

const ROOT = path.resolve(__dirname, "..");
const MIGRATION = path.join(
  ROOT,
  "supabase/migrations/20261008120000_phase3_batch_confirm_rpc.sql",
);

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

section("I-01 migration present");
{
  assert.ok(fs.existsSync(MIGRATION), "batch confirm RPC migration missing");
  const sql = fs.readFileSync(MIGRATION, "utf8");
  assert.match(sql, /confirm_batch_shopping_writes/);
  assert.match(sql, /security invoker/i);
  assert.match(sql, /grant execute[\s\S]*to authenticated/i);
  assert.match(sql, /trip not owned by caller/);
  assert.match(sql, /insert into public\.items/i);
  assert.match(sql, /insert into public\.receipts/i);
  assert.match(sql, /insert into public\.receipt_items/i);
  assert.doesNotMatch(sql, /security definer/i);
  assert.equal(
    CONFIRM_BATCH_SHOPPING_WRITES_RPC,
    "confirm_batch_shopping_writes",
  );
}

section("I-01 domain uses RPC only (no serial insert loop)");
{
  const domain = fs.readFileSync(
    path.join(ROOT, "lib/batch/confirm-batch-writes.ts"),
    "utf8",
  );
  assert.match(domain, /\.rpc\(/);
  assert.match(domain, /confirm_batch_shopping_writes/);
  assert.doesNotMatch(domain, /\.from\(["']items["']\)\s*\.insert/);
  assert.doesNotMatch(domain, /\.from\(["']receipts["']\)\s*\.insert/);

  const workflow = fs.readFileSync(
    path.join(ROOT, "lib/workflows/shared/confirm-batch-write.ts"),
    "utf8",
  );
  assert.match(workflow, /executeConfirmBatchShoppingWrites/);
  assert.match(workflow, /promoteTempReceiptToFormal/);
  assert.doesNotMatch(workflow, /convertTodoToItem/);
}

section("I-01 multi-write success / failure contract in SQL");
{
  const sql = fs.readFileSync(MIGRATION, "utf8");
  // Any raise aborts the function → Postgres rolls back the enclosing TX.
  assert.match(sql, /raise exception/i);
  assert.match(sql, /p_items must be a non-empty jsonb array/);
  // No per-item CONTINUE / EXCEPTION WHEN that swallows insert failures.
  assert.doesNotMatch(
    sql,
    /exception when others then\s*\n\s*null/i,
  );
}

section("I-02 bucket constants + 7-day TTL");
{
  assert.equal(RECEIPT_TEMP_BUCKET, "receipt-images-temp");
  assert.equal(RECEIPT_FORMAL_BUCKET, "receipt-images");
  assert.equal(RECEIPT_TEMP_TTL_MS, 7 * 24 * 60 * 60 * 1000);
}

section("I-02 path ownership + promote path shape");
{
  const userId = "11111111-1111-1111-1111-111111111111";
  assert.doesNotThrow(() =>
    assertOwnedReceiptPath(userId, `${userId}/temp/a.jpg`),
  );
  assert.throws(() => assertOwnedReceiptPath(userId, "other/temp/a.jpg"));
  assert.throws(() => assertOwnedReceiptPath(userId, `${userId}/../x.jpg`));

  const file = {
    name: "scan.PNG",
    type: "image/png",
  } as File;
  const tempPath = buildTempReceiptObjectPath(userId, file);
  assert.ok(tempPath.startsWith(`${userId}/temp/`));
  assert.ok(tempPath.endsWith(".png"));

  const formal = buildFormalReceiptObjectPath(userId, tempPath);
  assert.ok(formal.startsWith(`${userId}/formal/`));
  assert.equal(formal.split("/").pop(), tempPath.split("/").pop());
}

section("I-02 expiration helper");
{
  const now = Date.parse("2026-10-08T00:00:00.000Z");
  const within = now - RECEIPT_TEMP_TTL_MS + 1;
  const expired = now - RECEIPT_TEMP_TTL_MS - 1;
  assert.equal(isTempReceiptExpired(within, now), false);
  assert.equal(isTempReceiptExpired(expired, now), true);
  assert.equal(isTempReceiptExpired(Number.NaN, now), true);
}

section("I-02 lifecycle module coverage");
{
  const life = fs.readFileSync(
    path.join(ROOT, "lib/storage/receipt-lifecycle.ts"),
    "utf8",
  );
  assert.match(life, /uploadTempReceiptImage/);
  assert.match(life, /createSignedReceiptUrl/);
  assert.match(life, /deleteTempReceiptObject/);
  assert.match(life, /promoteTempReceiptToFormal/);
  assert.match(life, /cleanupExpiredTempReceipts/);
  assert.match(life, /RECEIPT_TEMP_BUCKET/);
  assert.match(life, /RECEIPT_FORMAL_BUCKET/);
  assert.doesNotMatch(life, /ocr/i);
  assert.doesNotMatch(life, /tesseract/i);

  const actions = fs.readFileSync(
    path.join(ROOT, "lib/workflows/shared/receipt-temp.ts"),
    "utf8",
  );
  assert.match(actions, /uploadTempReceipt/);
  assert.match(actions, /cleanupTempReceipt/);
  assert.match(actions, /sweepExpiredTempReceipts/);
  assert.match(actions, /getTempReceiptSignedUrl/);
}

section("I-02 cancel / expire hooks in CompanionHost");
{
  const host = fs.readFileSync(
    path.join(ROOT, "components/companion/CompanionHost.tsx"),
    "utf8",
  );
  assert.match(host, /cleanupTempReceipt/);
  assert.match(host, /sweepExpiredTempReceipts/);
  assert.match(host, /receiptImageRef/);
}

section("Scope: convertTodoToItem untouched; no OCR/STT/LLM providers");
{
  const todosMut = fs.readFileSync(
    path.join(ROOT, "lib/todos/mutations.ts"),
    "utf8",
  );
  assert.match(todosMut, /convertTodoToItem/);

  const providerHints = [
    "lib/ocr",
    "lib/stt",
    "lib/llm",
    "lib/providers/ocr",
    "lib/providers/stt",
    "lib/providers/llm",
  ];
  for (const rel of providerHints) {
    assert.equal(
      fs.existsSync(path.join(ROOT, rel)),
      false,
      `unexpected provider path: ${rel}`,
    );
  }
}

console.log("\nBatch 3 verify passed.\n");
