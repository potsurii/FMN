import type { SupabaseClient } from "@supabase/supabase-js";
import { createSignedImageUrl } from "@/lib/storage/upload";
import { buildTripStats } from "./stats";
import type { ItemRow, TripRow, TripWithStats } from "./types";

const TRIP_SELECT =
  "id, user_id, name, start_date, end_date, main_image, visibility, travel_status, created_at";

export async function fetchTripById(
  supabase: SupabaseClient,
  tripId: string,
): Promise<TripRow | null> {
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("id", tripId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load trip: ${error.message}`);
  }

  return (data as TripRow | null) ?? null;
}

export async function fetchTripWithStatsById(
  supabase: SupabaseClient,
  tripId: string,
): Promise<TripWithStats | null> {
  const trip = await fetchTripById(supabase, tripId);
  if (!trip) return null;

  const { data, error } = await supabase
    .from("items")
    .select("id, trip_id, name, price, currency, category, visibility")
    .eq("trip_id", tripId);

  if (error) {
    throw new Error(`Failed to load trip items: ${error.message}`);
  }

  const imageUrl = await createSignedImageUrl({
    supabase,
    bucket: "trip-images",
    path: trip.main_image,
  });
  const imageUrls = new Map<string, string | null>([[trip.id, imageUrl]]);

  const [withStats] = buildTripStats(
    [trip],
    (data ?? []) as ItemRow[],
    imageUrls,
  );

  return withStats ?? null;
}
