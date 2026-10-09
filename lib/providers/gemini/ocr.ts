import {
  toReceiptLineExtraction,
  type ReceiptLineExtraction,
} from "@/lib/workflows/record-input/receipt-draft-group";
import { requestGeminiJson, type GeminiCall } from "./call";
import { providerFailure, type ProviderResult } from "./types";

const OCR_PROMPT = [
  "Extract purchased product lines from this receipt image.",
  "Return JSON only: {\"lines\":[{\"product_name\":\"\",\"receipt_line_price\":null,\"quantity\":null}]}",
  "receipt_line_price is the amount printed on that product line.",
  "Do not divide the line amount by quantity.",
  "Set quantity only when the receipt explicitly prints it, otherwise null.",
  "Do not use the receipt total, discount, coupon, tax, tax-free mark, refund, or payment line as a product price.",
  "Do not guess a missing name, price, quantity, or location.",
].join(" ");

export function linesFromGeminiJson(value: unknown): ReceiptLineExtraction[] | null {
  if (!value || typeof value !== "object" || !Array.isArray((value as { lines?: unknown }).lines)) {
    return null;
  }
  const lines = (value as { lines: unknown[] }).lines.map((row) => {
    if (!row || typeof row !== "object") {
      return toReceiptLineExtraction({});
    }
    const record = row as Record<string, unknown>;
    return toReceiptLineExtraction({
      product_name: typeof record.product_name === "string" ? record.product_name : "",
      receipt_line_price:
        typeof record.receipt_line_price === "number" ? record.receipt_line_price : null,
      quantity: typeof record.quantity === "number" ? record.quantity : null,
    });
  });
  return lines.filter(
    (line) => line.product_name.trim() || line.receipt_line_price !== null,
  );
}

export function ocrRequestBody(input: { mimeType: string; base64: string }): unknown {
  return {
    contents: [
      {
        role: "user",
        parts: [
          { text: OCR_PROMPT },
          { inline_data: { mime_type: input.mimeType, data: input.base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  };
}

export async function extractReceiptLinesFromImage(input: {
  bytes: Uint8Array;
  mimeType: string;
  apiKey: string;
  call?: GeminiCall;
}): Promise<ProviderResult<ReceiptLineExtraction[]>> {
  const parsed = await requestGeminiJson({
    apiKey: input.apiKey,
    call: input.call,
    body: ocrRequestBody({
      mimeType: input.mimeType,
      base64: Buffer.from(input.bytes).toString("base64"),
    }),
  });
  if (!parsed.ok) return parsed;
  const lines = linesFromGeminiJson(parsed.value);
  if (!lines) return providerFailure("invalid", "收据识别结果无法使用。草稿仍保留。");
  if (lines.length < 1) {
    return providerFailure("empty", "没有识别到商品行。可以手动新增商品草稿。");
  }
  return { ok: true, value: lines };
}
