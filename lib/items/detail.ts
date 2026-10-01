import type { SupabaseClient } from "@supabase/supabase-js";
import { createSignedImageUrl } from "@/lib/storage/upload";
import { mapItemRecord } from "./map";
import type { ItemRecord, ItemWithDisplay } from "./types";

const ITEM_SELECT =
  "id, trip_id, name, price, currency, location, purchase_date, category, image, note, visibility, quantity, created_at";

export async function fetchItemById(
  supabase: SupabaseClient,
  tripId: string,
  itemId: string,
): Promise<ItemWithDisplay | null> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .eq("id", itemId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load item: ${error.message}`);
  }

  if (!data) return null;

  const row = data as ItemRecord;
  const imageUrl = await createSignedImageUrl({
    supabase,
    bucket: "item-images",
    path: row.image,
  });
  return mapItemRecord(row, imageUrl);
}
