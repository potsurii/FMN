/**
 * I-02 Receipt Storage stubs — temporary vs formal buckets.
 * Full temporary lifecycle (promote / cleanup jobs) is out of Batch 1 scope.
 */

export const RECEIPT_TEMP_BUCKET = "receipt-images-temp";
export const RECEIPT_FORMAL_BUCKET = "receipt-images";

export type ReceiptBucketKind = "temporary" | "formal";

export function receiptBucketId(kind: ReceiptBucketKind): string {
  return kind === "temporary" ? RECEIPT_TEMP_BUCKET : RECEIPT_FORMAL_BUCKET;
}
