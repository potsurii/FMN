import type { SupabaseClient } from "@supabase/supabase-js";
import { createSignedImageUrl } from "@/lib/storage/upload";
import { buildTripStats } from "./stats";
import type { ItemRow, TripRow, TripWithStats } from "./types";

const TRIP_SELECT =
  "id, user_id, name, start_date, end_date, main_image, destination, visibility, travel_status, created_at";

async function signTripImages(
  supabase: SupabaseClient,
  trips: TripRow[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  await Promise.all(
    trips.map(async (trip) => {
      const url = await createSignedImageUrl({
        supabase,
        bucket: "trip-images",
        path: trip.main_image,
      });
      map.set(trip.id, url);
    }),
  );
  return map;
}

/**
 * P1 My Trips: only trips owned by the current user.
 * Does not include other users' public trips.
 */
export async function fetchTripsWithStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<TripWithStats[]> {
  const tripsResult = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("user_id", userId)
    .order("start_date", { ascending: false });

  if (tripsResult.error) {
    throw new Error(`Failed to load trips: ${tripsResult.error.message}`);
  }

  const trips = (tripsResult.data ?? []) as TripRow[];
  if (trips.length === 0) {
    return [];
  }

  const tripIds = trips.map((trip) => trip.id);
  const itemsResult = await supabase
    .from("items")
    .select("id, trip_id, name, price, currency, category, visibility")
    .in("trip_id", tripIds);

  if (itemsResult.error) {
    throw new Error(`Failed to load items: ${itemsResult.error.message}`);
  }

  const items = (itemsResult.data ?? []) as ItemRow[];
  const imageUrls = await signTripImages(supabase, trips);

  return buildTripStats(trips, items, imageUrls);
}
