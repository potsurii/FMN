"use server";

import { isCategorySlug } from "@/lib/category";
import {
  executeConfirmBatchShoppingWrites,
} from "@/lib/batch/confirm-batch-writes";
import type {
  BatchShoppingRecordWrite,
  ConfirmBatchShoppingWritesResult,
} from "@/lib/batch/types";
import {
  isPurchaseDateInTripRange,
  purchaseDateOutOfRangeMessage,
} from "@/lib/items/validation";
import { parseQuantity } from "@/lib/quantity";
import {
  deleteFormalReceiptObject,
  deleteTempReceiptObject,
  promoteTempReceiptToFormal,
} from "@/lib/storage/receipt-lifecycle";
import { createClient } from "@/lib/supabase/server";

/**
 * Explicit Confirm payload for multi-record formal write (I-01).
 * Optional temp receipt path is promoted (I-02) then linked in the same RPC TX.
 */
export type ConfirmBatchShoppingWriteInput = {
  tripId: string;
  items: Array<{
    name: string;
    price: number;
    currency: string;
    location: string;
    purchaseDate: string;
    category: string | null;
    note: string | null;
    quantity: number;
    imagePath?: string | null;
    visibility?: "private" | "public";
  }>;
  /** Temp bucket object path; promoted before RPC, deleted after success. */
  tempReceiptPath?: string | null;
  receiptDate?: string | null;
};

export type ConfirmBatchShoppingWriteResult =
  | { ok: true; result: ConfirmBatchShoppingWritesResult }
  | { ok: false; error: string };

/**
 * Workflow: validate → (optional I-02 promote) → I-01 RPC → cleanup temp.
 * App-layer serial insert + compensation is not used for the DB boundary.
 */
export async function confirmBatchShoppingWrite(
  input: ConfirmBatchShoppingWriteInput,
): Promise<ConfirmBatchShoppingWriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "请先登录后再写入购物记录" };
  }

  const tripId = typeof input.tripId === "string" ? input.tripId.trim() : "";
  if (!tripId) {
    return { ok: false, error: "请选择所属旅行后再确认写入" };
  }

  if (!Array.isArray(input.items) || input.items.length < 1) {
    return { ok: false, error: "至少需要一条购物记录" };
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, user_id, start_date, end_date, visibility")
    .eq("id", tripId)
    .maybeSingle();

  if (tripError) {
    return { ok: false, error: tripError.message };
  }
  if (!trip || trip.user_id !== user.id) {
    return { ok: false, error: "无权向该旅行写入购物记录" };
  }

  const tripIsPrivate = trip.visibility === "private";
  const validated: BatchShoppingRecordWrite[] = [];

  for (let i = 0; i < input.items.length; i += 1) {
    const row = input.items[i];
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!name) {
      return { ok: false, error: `第 ${i + 1} 条：请填写商品名称` };
    }

    if (typeof row.price !== "number" || !Number.isFinite(row.price)) {
      return { ok: false, error: `第 ${i + 1} 条：请填写有效的实际支付价格` };
    }
    if (row.price < 0) {
      return { ok: false, error: `第 ${i + 1} 条：价格不能为负数` };
    }

    const currency =
      typeof row.currency === "string"
        ? row.currency.trim().toUpperCase()
        : "";
    if (!/^[A-Z]{3}$/.test(currency)) {
      return { ok: false, error: `第 ${i + 1} 条：请选择有效货币` };
    }

    const purchaseDate =
      typeof row.purchaseDate === "string" ? row.purchaseDate.trim() : "";
    if (!purchaseDate) {
      return { ok: false, error: `第 ${i + 1} 条：请选择购买日期` };
    }
    if (
      !isPurchaseDateInTripRange(
        purchaseDate,
        trip.start_date as string,
        trip.end_date as string,
      )
    ) {
      return {
        ok: false,
        error: `第 ${i + 1} 条：${purchaseDateOutOfRangeMessage(
          trip.start_date as string,
          trip.end_date as string,
        )}`,
      };
    }

    const quantity = parseQuantity(row.quantity);
    if (quantity === null) {
      return {
        ok: false,
        error: `第 ${i + 1} 条：数量必须为大于等于 1 的整数`,
      };
    }

    const category =
      row.category && isCategorySlug(row.category) ? row.category : "other";
    const location =
      typeof row.location === "string" ? row.location.trim() : "";
    const visibility = tripIsPrivate
      ? "private"
      : row.visibility === "public"
        ? "public"
        : "private";

    validated.push({
      name,
      price: row.price,
      currency,
      location,
      purchaseDate,
      category,
      image: row.imagePath ?? null,
      note: row.note,
      visibility,
      quantity,
    });
  }

  const tempPath =
    typeof input.tempReceiptPath === "string" &&
    input.tempReceiptPath.trim()
      ? input.tempReceiptPath.trim()
      : null;

  let formalPath: string | null = null;

  try {
    if (tempPath) {
      formalPath = await promoteTempReceiptToFormal({
        supabase,
        userId: user.id,
        tempPath,
      });
    }

    const receiptDate =
      typeof input.receiptDate === "string" && input.receiptDate.trim()
        ? input.receiptDate.trim()
        : null;

    const result = await executeConfirmBatchShoppingWrites(supabase, {
      tripId,
      items: validated,
      receipt: formalPath
        ? { imagePath: formalPath, receiptDate }
        : null,
    });

    if (tempPath) {
      try {
        await deleteTempReceiptObject({
          supabase,
          userId: user.id,
          path: tempPath,
        });
      } catch {
        // Temp cleanup may retry via expired sweep; formal write already committed.
      }
    }

    return { ok: true, result };
  } catch (err) {
    if (formalPath) {
      try {
        await deleteFormalReceiptObject({
          supabase,
          userId: user.id,
          path: formalPath,
        });
      } catch {
        // Best-effort orphan storage cleanup only (DB TX already rolled back).
      }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "批量写入失败，请重试",
    };
  }
}
