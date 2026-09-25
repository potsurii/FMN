import type { SupabaseClient } from "@supabase/supabase-js";
import { createSignedImageUrl } from "@/lib/storage/upload";
import { mapTodoRow } from "./map";
import type { ShoppingTodoRow, ShoppingTodoWithDisplay } from "./types";

export const TODO_SELECT =
  "id, trip_id, name, image, category, reference_price, reference_currency, reference_location, note, status, purchased_item_id, created_at, updated_at";

async function withSignedUrl(
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

/** Active todos for a trip (default shopping-todo list). */
export async function fetchActiveTodosByTripId(
  supabase: SupabaseClient,
  tripId: string,
): Promise<ShoppingTodoWithDisplay[]> {
  const { data, error } = await supabase
    .from("shopping_todos")
    .select(TODO_SELECT)
    .eq("trip_id", tripId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load shopping todos: ${error.message}`);
  }

  const rows = (data ?? []) as ShoppingTodoRow[];
  return Promise.all(rows.map((row) => withSignedUrl(supabase, row)));
}

export async function fetchTodoById(
  supabase: SupabaseClient,
  tripId: string,
  todoId: string,
): Promise<ShoppingTodoWithDisplay | null> {
  const { data, error } = await supabase
    .from("shopping_todos")
    .select(TODO_SELECT)
    .eq("id", todoId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load shopping todo: ${error.message}`);
  }

  if (!data) return null;
  return withSignedUrl(supabase, data as ShoppingTodoRow);
}
