/**
 * I-01 Atomic Batch Confirm — shared payload types.
 * Workflow validates; Domain calls Postgres RPC as the sole TX boundary.
 */

export type BatchShoppingRecordWrite = {
  name: string;
  price: number;
  currency: string;
  location: string;
  purchaseDate: string;
  category: string;
  image?: string | null;
  note?: string | null;
  visibility?: "private" | "public";
  quantity: number;
};

export type BatchReceiptWrite = {
  /** Formal bucket object path (after I-02 promotion). */
  imagePath: string;
  receiptDate?: string | null;
};

export type ConfirmBatchShoppingWritesInput = {
  tripId: string;
  items: BatchShoppingRecordWrite[];
  receipt?: BatchReceiptWrite | null;
};

export type ConfirmBatchShoppingWritesResult = {
  itemIds: string[];
  receiptId: string | null;
};
