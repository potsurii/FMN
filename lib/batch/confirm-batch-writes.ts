import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BatchReceiptWrite,
  BatchShoppingRecordWrite,
  ConfirmBatchShoppingWritesInput,
  ConfirmBatchShoppingWritesResult,
} from "./types";

/** Postgres RPC name — sole multi-record Confirm transaction boundary (I-01). */
export const CONFIRM_BATCH_SHOPPING_WRITES_RPC =
  "confirm_batch_shopping_writes";

type RpcRow = {
  item_ids?: unknown;
  receipt_id?: unknown;
};

function toRpcItem(item: BatchShoppingRecordWrite): Record<string, unknown> {
  return {
    name: item.name,
    price: item.price,
    currency: item.currency,
    location: item.location,
    purchase_date: item.purchaseDate,
    category: item.category,
    image: item.image ?? null,
    note: item.note ?? null,
    visibility: item.visibility ?? "private",
    quantity: item.quantity,
  };
}

function toRpcReceipt(
  receipt: BatchReceiptWrite | null | undefined,
): Record<string, unknown> | null {
  if (!receipt) return null;
  return {
    image_path: receipt.imagePath,
    receipt_date: receipt.receiptDate ?? null,
  };
}

function parseUuidArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

/**
 * Domain entry: invoke I-01 RPC. Do not serial-insert + compensate here.
 * Caller (Workflow) must validate auth/ownership/fields before calling.
 */
export async function executeConfirmBatchShoppingWrites(
  supabase: SupabaseClient,
  input: ConfirmBatchShoppingWritesInput,
): Promise<ConfirmBatchShoppingWritesResult> {
  if (!input.tripId) {
    throw new Error("tripId is required");
  }
  if (!Array.isArray(input.items) || input.items.length < 1) {
    throw new Error("items must be a non-empty array");
  }

  const { data, error } = await supabase.rpc(CONFIRM_BATCH_SHOPPING_WRITES_RPC, {
    p_trip_id: input.tripId,
    p_items: input.items.map(toRpcItem),
    p_receipt: toRpcReceipt(input.receipt),
  });

  if (error) {
    throw new Error(error.message ?? "Batch confirm write failed");
  }

  const row = (data ?? {}) as RpcRow;
  const itemIds = parseUuidArray(row.item_ids);
  if (itemIds.length !== input.items.length) {
    throw new Error("Batch confirm returned unexpected item_ids");
  }

  const receiptId =
    typeof row.receipt_id === "string" ? row.receipt_id : null;

  if (input.receipt && !receiptId) {
    throw new Error("Batch confirm did not return receipt_id");
  }

  return { itemIds, receiptId };
}
