/**
 * I-02 Receipt Storage — temporary vs formal buckets.
 * Lifecycle helpers live in `receipt-lifecycle.ts`.
 */

export const RECEIPT_TEMP_BUCKET = "receipt-images-temp";
export const RECEIPT_FORMAL_BUCKET = "receipt-images";

/** Temporary Receipt Asset max retention (I-02): 7 days. */
export const RECEIPT_TEMP_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type ReceiptBucketKind = "temporary" | "formal";

export function receiptBucketId(kind: ReceiptBucketKind): string {
  return kind === "temporary" ? RECEIPT_TEMP_BUCKET : RECEIPT_FORMAL_BUCKET;
}
