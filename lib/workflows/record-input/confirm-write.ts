"use server";

import { isCategorySlug } from "@/lib/category";
import { createItem } from "@/lib/items/mutations";
import type { ItemWithDisplay } from "@/lib/items/types";
import {
  isPurchaseDateInTripRange,
  purchaseDateOutOfRangeMessage,
} from "@/lib/items/validation";
import { parseQuantity } from "@/lib/quantity";
import { createClient } from "@/lib/supabase/server";

/**
 * Formal write payload for F3-01 Companion Confirm.
 * Client must only call this from an Explicit Confirm Action.
 * Server re-validates auth, trip ownership, and required fields.
 */
export type ConfirmShoppingRecordWriteInput = {
  tripId: string;
  name: string;
  price: number;
  currency: string;
  /** Actual purchase location; empty string allowed (未填写). */
  location: string;
  purchaseDate: string;
  category: string | null;
  note: string | null;
  quantity: number;
  imagePath?: string | null;
  visibility?: "private" | "public";
};

export type ConfirmShoppingRecordWriteResult =
  | { ok: true; item: ItemWithDisplay }
  | { ok: false; error: string };

export async function confirmShoppingRecordWrite(
  input: ConfirmShoppingRecordWriteInput,
): Promise<ConfirmShoppingRecordWriteResult> {
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

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    return { ok: false, error: "请填写商品名称" };
  }

  if (typeof input.price !== "number" || !Number.isFinite(input.price)) {
    return { ok: false, error: "请填写有效的实际支付价格" };
  }
  if (input.price < 0) {
    return { ok: false, error: "价格不能为负数" };
  }

  const currency =
    typeof input.currency === "string"
      ? input.currency.trim().toUpperCase()
      : "";
  if (!/^[A-Z]{3}$/.test(currency)) {
    return { ok: false, error: "请选择有效货币" };
  }

  const purchaseDate =
    typeof input.purchaseDate === "string" ? input.purchaseDate.trim() : "";
  if (!purchaseDate) {
    return { ok: false, error: "请选择购买日期" };
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
      error: purchaseDateOutOfRangeMessage(
        trip.start_date as string,
        trip.end_date as string,
      ),
    };
  }

  const quantity = parseQuantity(input.quantity);
  if (quantity === null) {
    return { ok: false, error: "数量必须为大于等于 1 的整数" };
  }

  const category =
    input.category && isCategorySlug(input.category)
      ? input.category
      : "other";

  const location =
    typeof input.location === "string" ? input.location.trim() : "";

  const tripIsPrivate = trip.visibility === "private";
  const visibility =
    tripIsPrivate
      ? "private"
      : input.visibility === "public"
        ? "public"
        : "private";

  try {
    const item = await createItem(supabase, {
      tripId,
      name,
      price: input.price,
      currency,
      location,
      purchaseDate,
      category,
      imagePath: input.imagePath ?? null,
      note: input.note,
      visibility,
      quantity,
    });
    return { ok: true, item };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "写入失败，请重试",
    };
  }
}
