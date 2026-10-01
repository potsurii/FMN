import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReceiptRecord, ReceiptWithDisplay } from "./types";

const RECEIPT_SELECT = "id, user_id, image_path, receipt_date, created_at";

function mapReceipt(row: ReceiptRecord): ReceiptWithDisplay {
  return {
    id: row.id,
    userId: row.user_id,
    imagePath: row.image_path,
    receiptDate: row.receipt_date,
    createdAt: row.created_at,
  };
}

export type CreateReceiptInput = {
  userId: string;
  imagePath: string;
  receiptDate?: string | null;
};

/**
 * Create a formal Receipt row (after Confirm promotion).
 * Temporary receipt assets must not call this until Confirm.
 */
export async function createReceipt(
  supabase: SupabaseClient,
  input: CreateReceiptInput,
): Promise<ReceiptWithDisplay> {
  const { data, error } = await supabase
    .from("receipts")
    .insert({
      user_id: input.userId,
      image_path: input.imagePath,
      receipt_date: input.receiptDate ?? null,
    })
    .select(RECEIPT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create receipt");
  }

  return mapReceipt(data as ReceiptRecord);
}

/**
 * Link Shopping Records to a Receipt.
 * FK: receipt_items.receipt_id ON DELETE CASCADE — deletes join rows only.
 * FK: receipt_items.item_id ON DELETE CASCADE — if item deleted, join goes;
 * deleting a Receipt never deletes items.
 */
export async function linkReceiptItems(
  supabase: SupabaseClient,
  receiptId: string,
  itemIds: string[],
): Promise<void> {
  if (itemIds.length === 0) return;

  const rows = itemIds.map((itemId) => ({
    receipt_id: receiptId,
    item_id: itemId,
  }));

  const { error } = await supabase.from("receipt_items").insert(rows);
  if (error) {
    throw new Error(error.message ?? "Failed to link receipt items");
  }
}

/**
 * Delete Receipt. Shopping Records remain (CASCADE only on receipt_items).
 */
export async function deleteReceipt(
  supabase: SupabaseClient,
  receiptId: string,
): Promise<void> {
  const { error } = await supabase
    .from("receipts")
    .delete()
    .eq("id", receiptId);

  if (error) {
    throw new Error(error.message ?? "Failed to delete receipt");
  }
}
