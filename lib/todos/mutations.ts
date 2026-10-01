import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategorySlug } from "@/lib/category";
import { createItem, deleteItem, type CreateItemInput } from "@/lib/items/mutations";
import type { ItemWithDisplay } from "@/lib/items/types";
import { DEFAULT_QUANTITY, parseQuantity } from "@/lib/quantity";
import { createSignedImageUrl } from "@/lib/storage/upload";
import { mapTodoRow } from "./map";
import { TODO_SELECT } from "./queries";
import type { ShoppingTodoRow, ShoppingTodoWithDisplay } from "./types";

export type CreateTodoInput = {
  tripId: string;
  name: string;
  imagePath?: string | null;
  category?: CategorySlug | null;
  referencePrice?: number | null;
  referenceCurrency?: string | null;
  /** Target / planned purchase location. */
  referenceLocation?: string | null;
  note?: string | null;
  quantity?: number;
};

export type UpdateTodoInput = CreateTodoInput & {
  todoId: string;
};

function resolveQuantity(value: number | undefined): number {
  const parsed = parseQuantity(value ?? DEFAULT_QUANTITY);
  if (parsed === null) {
    throw new Error("数量必须为大于等于 1 的整数");
  }
  return parsed;
}

async function toDisplay(
  supabase: SupabaseClient,
  row: ShoppingTodoRow,
): Promise<ShoppingTodoWithDisplay> {
  const imageUrl = await createSignedImageUrl({
    supabase,
    bucket: "item-images",
    path: row.image,
  });
  return mapTodoRow(row, imageUrl);
}

export async function createTodo(
  supabase: SupabaseClient,
  input: CreateTodoInput,
): Promise<ShoppingTodoWithDisplay> {
  const quantity = resolveQuantity(input.quantity);

  const { data, error } = await supabase
    .from("shopping_todos")
    .insert({
      trip_id: input.tripId,
      name: input.name,
      image: input.imagePath ?? null,
      category: input.category ?? null,
      reference_price: input.referencePrice ?? null,
      reference_currency: input.referenceCurrency ?? null,
      reference_location: input.referenceLocation ?? null,
      note: input.note ?? null,
      status: "active",
      quantity,
    })
    .select(TODO_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create shopping todo");
  }

  return toDisplay(supabase, data as ShoppingTodoRow);
}

export async function updateTodo(
  supabase: SupabaseClient,
  input: UpdateTodoInput,
): Promise<ShoppingTodoWithDisplay> {
  const quantity = resolveQuantity(input.quantity);

  const { data, error } = await supabase
    .from("shopping_todos")
    .update({
      name: input.name,
      image: input.imagePath ?? null,
      category: input.category ?? null,
      reference_price: input.referencePrice ?? null,
      reference_currency: input.referenceCurrency ?? null,
      reference_location: input.referenceLocation ?? null,
      note: input.note ?? null,
      quantity,
    })
    .eq("id", input.todoId)
    .eq("trip_id", input.tripId)
    .eq("status", "active")
    .select(TODO_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update shopping todo");
  }

  return toDisplay(supabase, data as ShoppingTodoRow);
}

export async function deleteTodo(
  supabase: SupabaseClient,
  todoId: string,
): Promise<void> {
  const { error } = await supabase
    .from("shopping_todos")
    .delete()
    .eq("id", todoId);

  if (error) {
    throw new Error(error.message ?? "Failed to delete shopping todo");
  }
}

/**
 * Create Item then mark Todo converted atomically from the app’s perspective.
 * Uses status=active guard so a concurrent convert cannot double-create.
 * Rolls back the Item if the Todo update fails / races.
 */
export async function convertTodoToItem(
  supabase: SupabaseClient,
  options: {
    tripId: string;
    todoId: string;
    item: CreateItemInput;
  },
): Promise<{ item: ItemWithDisplay; todo: ShoppingTodoWithDisplay }> {
  const existing = await supabase
    .from("shopping_todos")
    .select(TODO_SELECT)
    .eq("id", options.todoId)
    .eq("trip_id", options.tripId)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  const row = existing.data as ShoppingTodoRow | null;
  if (!row) {
    throw new Error("购物代办不存在");
  }
  if (row.status !== "active" || row.purchased_item_id) {
    throw new Error("该购物代办已转换为购买记录，无法再次转换");
  }

  const item = await createItem(supabase, {
    ...options.item,
    tripId: options.tripId,
    visibility: options.item.visibility ?? "private",
    quantity:
      options.item.quantity ??
      parseQuantity(row.quantity) ??
      DEFAULT_QUANTITY,
  });

  const { data: converted, error: convertError } = await supabase
    .from("shopping_todos")
    .update({
      status: "converted",
      purchased_item_id: item.id,
    })
    .eq("id", options.todoId)
    .eq("trip_id", options.tripId)
    .eq("status", "active")
    .is("purchased_item_id", null)
    .select(TODO_SELECT)
    .maybeSingle();

  if (convertError || !converted) {
    try {
      await deleteItem(supabase, item.id);
    } catch {
      // best-effort compensation
    }
    throw new Error(
      convertError?.message ??
        "该购物代办已被转换或无法更新，购买记录未保留",
    );
  }

  return {
    item,
    todo: await toDisplay(supabase, converted as ShoppingTodoRow),
  };
}
