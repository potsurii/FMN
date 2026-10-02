"use server";

/**
 * F3-04 Companion Confirm → formal Shopping Todo write.
 * Client must only call from Explicit Confirm.
 * Server re-validates auth, trip ownership, and New Todo required fields.
 * Does not force-fill Legacy todos (this path only creates New todos).
 */

import { isCategorySlug } from "@/lib/category";
import { parseQuantity } from "@/lib/quantity";
import { createClient } from "@/lib/supabase/server";
import { createTodo } from "@/lib/todos/mutations";
import type { ShoppingTodoWithDisplay } from "@/lib/todos/types";

export type ConfirmShoppingTodoWriteInput = {
  tripId: string;
  name: string;
  referencePrice: number;
  referenceCurrency: string;
  referenceLocation: string;
  category: string | null;
  note: string | null;
  quantity: number;
  imagePath?: string | null;
};

export type ConfirmShoppingTodoWriteResult =
  | { ok: true; todo: ShoppingTodoWithDisplay }
  | { ok: false; error: string };

export async function confirmShoppingTodoWrite(
  input: ConfirmShoppingTodoWriteInput,
): Promise<ConfirmShoppingTodoWriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "请先登录后再写入购物代办" };
  }

  const tripId = typeof input.tripId === "string" ? input.tripId.trim() : "";
  if (!tripId) {
    return { ok: false, error: "请选择所属旅行后再确认写入" };
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, user_id")
    .eq("id", tripId)
    .maybeSingle();

  if (tripError) {
    return { ok: false, error: tripError.message };
  }
  if (!trip || trip.user_id !== user.id) {
    return { ok: false, error: "无权向该旅行写入购物代办" };
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    return { ok: false, error: "请填写商品名称" };
  }

  if (
    typeof input.referencePrice !== "number" ||
    !Number.isFinite(input.referencePrice)
  ) {
    return { ok: false, error: "请填写有效的具体参考价格" };
  }
  if (input.referencePrice < 0) {
    return { ok: false, error: "参考价格不能为负数" };
  }

  const currency =
    typeof input.referenceCurrency === "string"
      ? input.referenceCurrency.trim().toUpperCase()
      : "";
  if (!/^[A-Z]{3}$/.test(currency)) {
    return { ok: false, error: "请选择有效参考货币" };
  }

  const location =
    typeof input.referenceLocation === "string"
      ? input.referenceLocation.trim()
      : "";
  if (!location) {
    return { ok: false, error: "请填写计划购买地点" };
  }

  const quantity = parseQuantity(input.quantity);
  if (quantity === null) {
    return { ok: false, error: "数量必须为大于等于 1 的整数" };
  }

  let category = null;
  if (input.category && isCategorySlug(input.category)) {
    category = input.category;
  }

  try {
    const todo = await createTodo(supabase, {
      tripId,
      name,
      referencePrice: input.referencePrice,
      referenceCurrency: currency,
      referenceLocation: location,
      category,
      note:
        typeof input.note === "string" && input.note.trim()
          ? input.note.trim()
          : null,
      quantity,
      imagePath: input.imagePath ?? null,
    });
    return { ok: true, todo };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "写入购物代办失败";
    return { ok: false, error: msg };
  }
}
