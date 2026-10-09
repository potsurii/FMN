/**
 * Batch 4-C — Gemini provider boundary (injected calls, no live API).
 *   npm run test:batch4c
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { shoppingRecordDraftFromLlmFields } from "../lib/workflows/record-input/llm-draft";
import { receiptDraftGroupFromStructured } from "../lib/workflows/record-input/receipt-draft-group";
import { requestGeminiJson, type GeminiCall } from "../lib/providers/gemini/call";
import { readGeminiApiKey } from "../lib/providers/gemini/config";
import {
  extractExplicitFields,
  fieldsFromGeminiJson,
  refusalForLlmInput,
} from "../lib/providers/gemini/llm";
import {
  extractReceiptLinesFromImage,
  linesFromGeminiJson,
} from "../lib/providers/gemini/ocr";
import {
  normalizeAudioMime,
  transcriptFromGeminiJson,
  transcribeAudio,
} from "../lib/providers/gemini/stt";

const ROOT = path.resolve(__dirname, "..");

function jsonCall(payload: unknown, status = 200): GeminiCall {
  return async () => ({
    status,
    json: { candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] },
  });
}

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

async function main() {

section("OCR keeps the printed line price and explicit quantity");
{
  const lines = linesFromGeminiJson({
    lines: [{ product_name: "KITKAT", receipt_line_price: 900, quantity: 3 }],
  });
  assert.equal(lines?.[0]?.receipt_line_price, 900);
  assert.equal(lines?.[0]?.quantity, 3);
  const group = receiptDraftGroupFromStructured(
    { items: lines ?? [] },
    { tripId: "trip-1", tripLabel: "Tokyo" },
  );
  assert.equal(group.items[0]?.price, 900);
  assert.equal(group.items[0]?.quantity, 3);
  assert.notEqual(group.items[0]?.price, 300);
}

section("OCR missing quantity stays null before the draft default");
{
  const lines = linesFromGeminiJson({
    lines: [{ product_name: "KITKAT", receipt_line_price: 900, quantity: null }],
  });
  assert.equal(lines?.[0]?.quantity, null);
  const group = receiptDraftGroupFromStructured(
    { items: lines ?? [] },
    { tripId: "trip-1", tripLabel: "Tokyo" },
  );
  assert.equal(group.items[0]?.quantity, 1);
  assert.equal(group.items[0]?.location, "");
}

section("OCR ignores a receipt total and does not apply a discount");
{
  const lines = linesFromGeminiJson({
    lines: [
      { product_name: "A", receipt_line_price: 900, quantity: null },
      { product_name: "B", receipt_line_price: 500, quantity: null },
    ],
    total: 1400,
    discount: -200,
  });
  assert.equal(lines?.[0]?.receipt_line_price, 900);
  assert.equal(lines?.[1]?.receipt_line_price, 500);
  assert.equal(linesFromGeminiJson({ total: 1400 }), null);
}

section("OCR invalid or failed provider responses do not invent lines");
{
  assert.equal(linesFromGeminiJson({ lines: "nope" }), null);
  const timeout = await extractReceiptLinesFromImage({
    bytes: new Uint8Array([1]),
    mimeType: "image/jpeg",
    apiKey: "test-key",
    call: async () => {
      throw Object.assign(new Error("timeout"), { name: "TimeoutError" });
    },
  });
  assert.equal(timeout.ok, false);
  if (!timeout.ok) assert.equal(timeout.code, "timeout");
  const invalid = await extractReceiptLinesFromImage({
    bytes: new Uint8Array([1]),
    mimeType: "image/jpeg",
    apiKey: "test-key",
    call: jsonCall({ nope: true }),
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.code, "invalid");
}

section("STT validates transcript, empty audio, timeout, and mime");
{
  assert.equal(transcriptFromGeminiJson({ transcript: " 买了 KITKAT " }), "买了 KITKAT");
  assert.equal(transcriptFromGeminiJson({ transcript: 900 }), null);
  assert.equal(normalizeAudioMime("audio/webm;codecs=opus"), "audio/webm");
  assert.equal(normalizeAudioMime("image/jpeg"), null);
  const empty = await transcribeAudio({
    bytes: new Uint8Array([1]),
    mimeType: "audio/webm",
    apiKey: "test-key",
    call: jsonCall({ transcript: "   " }),
  });
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.code, "empty");
  const timedOut = await transcribeAudio({
    bytes: new Uint8Array([1]),
    mimeType: "audio/wav",
    apiKey: "test-key",
    call: async () => {
      throw Object.assign(new Error("abort"), { name: "AbortError" });
    },
  });
  assert.equal(timedOut.ok, false);
  if (!timedOut.ok) assert.equal(timedOut.code, "timeout");
  const badMime = await transcribeAudio({
    bytes: new Uint8Array([1]),
    mimeType: "application/octet-stream",
    apiKey: "test-key",
  });
  assert.equal(badMime.ok, false);
  if (!badMime.ok) assert.equal(badMime.code, "unsupported");
}

section("LLM keeps missing fields empty and rejects vague confirmation");
{
  assert.equal(refusalForLlmInput("好的"), "这句话不是明确的购物内容，也不是写入确认。");
  assert.match(refusalForLlmInput("确认写入") ?? "", /不会保存/);
  const fields = fieldsFromGeminiJson({
    product_name: "KITKAT",
    price: null,
    currency: null,
    quantity: null,
    purchase_date: null,
    location: null,
  });
  assert.ok(fields);
  const draft = shoppingRecordDraftFromLlmFields(fields!, {
    sourceText: "KITKAT",
    tripId: "trip-1",
    tripLabel: "Tokyo",
  });
  assert.equal(draft.name, "KITKAT");
  assert.equal(draft.price, null);
  assert.equal(draft.currency, null);
  assert.equal(draft.purchaseDate, null);
  assert.equal(draft.location, "");
  assert.equal(draft.quantity, 1);
  const invalid = await extractExplicitFields({
    userText: "买了 KITKAT",
    apiKey: "test-key",
    call: jsonCall("not-json-object"),
  });
  assert.equal(invalid.ok, false);
  const vague = await extractExplicitFields({
    userText: "嗯",
    apiKey: "test-key",
    call: async () => {
      throw new Error("should not call");
    },
  });
  assert.equal(vague.ok, false);
}

section("provider failures stay recoverable and do not write");
{
  const failed = await requestGeminiJson({
    apiKey: "test-key",
    body: {},
    call: async () => ({ status: 500, json: { error: "secret-test-key" } }),
  });
  assert.equal(failed.ok, false);
  if (!failed.ok) assert.equal(failed.error.includes("secret-test-key"), false);
  assert.equal(readGeminiApiKey({}), null);
  assert.equal(readGeminiApiKey({ GEMINI_API_KEY: "  " }), null);
  const action = fs.readFileSync(
    path.join(ROOT, "lib/workflows/record-input/gemini-actions.ts"),
    "utf8",
  );
  assert.doesNotMatch(action, /confirmBatchShoppingWrite|confirmShoppingRecordWrite/);
  assert.doesNotMatch(action, /\.insert\(|\.from\(\s*["']items["']/);
  assert.match(action, /readGeminiApiKey/);
  assert.doesNotMatch(action, /NEXT_PUBLIC_GEMINI/);
  const config = fs.readFileSync(
    path.join(ROOT, "lib/providers/gemini/config.ts"),
    "utf8",
  );
  assert.match(config, /GEMINI_API_KEY_ENV = "GEMINI_API_KEY"/);
  assert.doesNotMatch(config, /process\.env\.NEXT_PUBLIC_/);
}

  console.log("\nBatch 4-C verify passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
