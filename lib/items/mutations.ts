import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_QUANTITY, parseQuantity } from "@/lib/quantity";
import { createSignedImageUrl } from "@/lib/storage/upload";
import { mapItemRecord } from "./map";
import type { ItemRecord, ItemWithDisplay, Visibility } from "./types";

export type CreateItemInput = {
  tripId: string;
  name: string;
  price: number;
  currency: string;
  location: string;
  purchaseDate: string;
  category: string;
  imagePath?: string | null;
  note?: string | null;
  visibility?: Visibility;
  quantity?: number;
};

export type UpdateItemInput = {
  itemId: string;
  tripId: string;
  name: string;
  price: number;
  currency: string;
  location: string;
  purchaseDate: string;
  category: string;
  imagePath?: string | null;
  note?: string | null;
  visibility: Visibility;
  quantity?: number;
};

const ITEM_SELECT =
  "id, trip_id, name, price, currency, location, purchase_date, category, image, note, visibility, quantity, created_at";

function resolveQuantity(value: number | undefined): number {
  const parsed = parseQuantity(value ?? DEFAULT_QUANTITY);
  if (parsed === null) {
    throw new Error("数量必须为大于等于 1 的整数");
  }
  return parsed;
}

async function toDisplay(
  supabase: SupabaseClient,
  row: ItemRecord,
): Promise<ItemWithDisplay> {
  const imageUrl = await createSignedImageUrl({
    supabase,
    bucket: "item-images",
    path: row.image,
  });
  return mapItemRecord(row, imageUrl);
}

export async function createItem(
  supabase: SupabaseClient,
  input: CreateItemInput,
): Promise<ItemWithDisplay> {
  const quantity = resolveQuantity(input.quantity);

  const { data, error } = await supabase
    .from("items")
    .insert({
      trip_id: input.tripId,
      name: input.name,
      price: input.price,
      currency: input.currency,
      location: input.location,
      purchase_date: input.purchaseDate,
      category: input.category,
      image: input.imagePath ?? null,
      note: input.note?.trim() ? input.note.trim() : null,
      visibility: input.visibility ?? "private",
      quantity,
    })
    .select(ITEM_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create item");
  }

  return toDisplay(supabase, data as ItemRecord);
}

export async function updateItem(
  supabase: SupabaseClient,
  input: UpdateItemInput,
): Promise<ItemWithDisplay> {
  const quantity = resolveQuantity(input.quantity);

  const { data, error } = await supabase
    .from("items")
    .update({
      name: input.name,
      price: input.price,
      currency: input.currency,
      location: input.location,
      purchase_date: input.purchaseDate,
      category: input.category,
      image: input.imagePath ?? null,
      note: input.note?.trim() ? input.note.trim() : null,
      visibility: input.visibility,
      quantity,
    })
    .eq("id", input.itemId)
    .eq("trip_id", input.tripId)
    .select(ITEM_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update item");
  }

  return toDisplay(supabase, data as ItemRecord);
}

export async function deleteItem(
  supabase: SupabaseClient,
  itemId: string,
): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("id", itemId);

  if (error) {
    throw new Error(error.message ?? "Failed to delete item");
  }
}
