/**
 * Receipt Draft Group helpers (Batch 4-A).
 * Client draft only. Copies explicit fields. No provider calls and no database writes.
 */

import {
  createEmptyShoppingRecordDraft,
  newDraftId,
  type ReceiptDraftGroup,
  type ShoppingRecordDraft,
} from "@/lib/companion/types";
import { DEFAULT_QUANTITY, parseQuantity } from "@/lib/quantity";
import { getShoppingRecordDraftMissing } from "./text-parse";

/**
 * L-04 extraction line. Not a Shopping Record and not items.price.
 * quantity stays null when the receipt does not state it.
 */
export type ReceiptLineExtraction = {
  product_name: string;
  receipt_line_price: number | null;
  quantity: number | null;
};

/**
 * Already-structured receipt handoff. Line items use ReceiptLineExtraction.
 * This module does not call a provider and does not write the database.
 */
export type StructuredReceiptInformation = {
  receiptDate?: string | null;
  merchant?: string | null;
  receiptImageRef?: string | null;
  items?: ReceiptLineExtraction[];
};

function touch(group: ReceiptDraftGroup): ReceiptDraftGroup {
  return { ...group, updatedAt: new Date().toISOString() };
}

export function createEmptyReceiptDraftGroup(): ReceiptDraftGroup {
  const now = new Date().toISOString();
  return {
    version: 1,
    id: newDraftId(),
    createdAt: now,
    updatedAt: now,
    receiptImageRef: null,
    receiptDate: null,
    merchant: "",
    items: [],
  };
}

export function addReceiptItemDraft(
  group: ReceiptDraftGroup,
  item: ShoppingRecordDraft,
): ReceiptDraftGroup {
  return touch({
    ...group,
    items: [
      ...group.items,
      { ...item, receiptImageRef: null },
    ],
  });
}

export function updateReceiptItemDraft(
  group: ReceiptDraftGroup,
  itemId: string,
  next: ShoppingRecordDraft,
): ReceiptDraftGroup {
  return touch({
    ...group,
    items: group.items.map((item) =>
      item.id === itemId
        ? { ...next, id: itemId, receiptImageRef: null }
        : item,
    ),
  });
}

export function deleteReceiptItemDraft(
  group: ReceiptDraftGroup,
  itemId: string,
): ReceiptDraftGroup {
  return touch({
    ...group,
    items: group.items.filter((item) => item.id !== itemId),
  });
}

function copyLinePrice(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

/** Explicit receipt quantity only. Missing or invalid stays null. */
export function extractionQuantity(
  value: number | null | undefined,
): number | null {
  if (value === undefined || value === null) return null;
  return parseQuantity(value);
}

export function toReceiptLineExtraction(input: {
  product_name?: string | null;
  receipt_line_price?: number | null;
  quantity?: number | null;
}): ReceiptLineExtraction {
  return {
    product_name:
      typeof input.product_name === "string" ? input.product_name : "",
    receipt_line_price: copyLinePrice(input.receipt_line_price),
    quantity: extractionQuantity(input.quantity),
  };
}

/**
 * Draft boundary only. ShoppingRecordDraft.quantity is a number.
 * Existing draft behavior uses 1 when the user did not supply a quantity.
 * This is not an extraction result.
 */
function draftQuantityFromExtraction(quantity: number | null): number {
  return parseQuantity(quantity) ?? DEFAULT_QUANTITY;
}

function itemFromExtraction(
  row: ReceiptLineExtraction,
  options: {
    tripId: string | null;
    tripLabel: string | null;
  },
): ShoppingRecordDraft {
  const base = createEmptyShoppingRecordDraft({
    sourceText: "",
    tripId: options.tripId,
    tripLabel: options.tripLabel,
    purchaseDateDefault: null,
  });
  return {
    ...base,
    name: row.product_name,
    // Candidate only. Confirm is what writes items.price.
    price: copyLinePrice(row.receipt_line_price),
    quantity: draftQuantityFromExtraction(row.quantity),
    receiptImageRef: null,
  };
}

/**
 * Turn extraction lines into editable drafts.
 * receipt_line_price becomes the draft price candidate. It is not items.price.
 */
export function receiptDraftGroupFromStructured(
  info: StructuredReceiptInformation,
  options: {
    tripId: string | null;
    tripLabel: string | null;
  },
): ReceiptDraftGroup {
  const receiptDate =
    typeof info.receiptDate === "string" && info.receiptDate.trim()
      ? info.receiptDate.trim()
      : null;
  let group = createEmptyReceiptDraftGroup();
  group = {
    ...group,
    receiptDate,
    merchant: typeof info.merchant === "string" ? info.merchant : "",
    receiptImageRef:
      typeof info.receiptImageRef === "string" && info.receiptImageRef.trim()
        ? info.receiptImageRef.trim()
        : null,
  };
  for (const row of info.items ?? []) {
    group = addReceiptItemDraft(
      group,
      itemFromExtraction(row, {
        tripId: options.tripId,
        tripLabel: options.tripLabel,
      }),
    );
  }
  return group;
}

export type ReceiptGroupConfirmState = {
  ready: boolean;
  reasons: string[];
};

/**
 * Formal write needs at least one complete item (existing I-01 non-empty array).
 * A group with zero items remains a valid review draft.
 */
export function getReceiptDraftGroupConfirmState(
  group: ReceiptDraftGroup,
): ReceiptGroupConfirmState {
  const reasons: string[] = [];
  if (group.items.length < 1) {
    reasons.push("至少一条商品草稿");
    return { ready: false, reasons };
  }

  const tripIds = new Set(
    group.items.map((item) => item.tripId).filter((id): id is string => !!id),
  );
  if (tripIds.size !== 1 || group.items.some((item) => !item.tripId)) {
    reasons.push("所有商品须属于同一旅行");
  }

  group.items.forEach((item, index) => {
    const { complete, missing } = getShoppingRecordDraftMissing(item);
    if (!complete) {
      reasons.push(`第 ${index + 1} 条：${missing.join("、")}`);
    }
  });

  return { ready: reasons.length === 0, reasons };
}
