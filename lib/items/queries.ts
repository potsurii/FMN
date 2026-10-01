import type { SupabaseClient } from "@supabase/supabase-js";
import { createSignedImageUrl } from "@/lib/storage/upload";
import { mapItemRecord } from "./map";
import type { ItemRecord, ItemWithDisplay } from "./types";

const ITEM_SELECT =
  "id, trip_id, name, price, currency, location, purchase_date, category, image, note, visibility, quantity, created_at";

async function mapWithSignedUrl(
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

export async function fetchItemsByTripId(
  supabase: SupabaseClient,
  tripId: string,
): Promise<ItemWithDisplay[]> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .eq("trip_id", tripId)
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load items: ${error.message}`);
  }

  const rows = (data ?? []) as ItemRecord[];
  return Promise.all(rows.map((row) => mapWithSignedUrl(supabase, row)));
}
