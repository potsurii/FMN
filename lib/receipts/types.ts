/**
 * Receipt is an independent entity (D1-02 / D1-03).
 * receipt_date is independent of Shopping Record purchase_date.
 */
export type ReceiptRecord = {
  id: string;
  user_id: string;
  image_path: string;
  receipt_date: string | null;
  created_at: string;
};

export type ReceiptItemLink = {
  receipt_id: string;
  item_id: string;
};

export type ReceiptWithDisplay = {
  id: string;
  userId: string;
  imagePath: string;
  receiptDate: string | null;
  createdAt: string;
};
