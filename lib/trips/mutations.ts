import type { SupabaseClient } from "@supabase/supabase-js";
import type { TripRow, TravelStatus, Visibility } from "@/lib/trips/types";

export type CreateTripInput = {
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  /** Required by application layer for new trips; DB remains nullable. */
  destination: string;
  mainImagePath?: string | null;
  visibility?: Visibility;
  travelStatus?: TravelStatus;
};

export type UpdateTripInput = {
  tripId: string;
  name: string;
  startDate: string;
  endDate: string;
  /** Null allowed for historical trips that never had Destination. */
  destination: string | null;
  mainImagePath?: string | null;
  visibility: Visibility;
  travelStatus: TravelStatus;
};

const TRIP_SELECT =
  "id, user_id, name, start_date, end_date, main_image, destination, visibility, travel_status, created_at";

export async function createTrip(
  supabase: SupabaseClient,
  input: CreateTripInput,
): Promise<TripRow> {
  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: input.userId,
      name: input.name,
      start_date: input.startDate,
      end_date: input.endDate,
      destination: input.destination,
      main_image: input.mainImagePath ?? null,
      visibility: input.visibility ?? "private",
      travel_status: input.travelStatus ?? "upcoming",
    })
    .select(TRIP_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create trip");
  }

  return data as TripRow;
}

export async function updateTrip(
  supabase: SupabaseClient,
  input: UpdateTripInput,
): Promise<TripRow> {
  const { data, error } = await supabase
    .from("trips")
    .update({
      name: input.name,
      start_date: input.startDate,
      end_date: input.endDate,
      destination: input.destination,
      main_image: input.mainImagePath ?? null,
      visibility: input.visibility,
      travel_status: input.travelStatus,
    })
    .eq("id", input.tripId)
    .select(TRIP_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update trip");
  }

  return data as TripRow;
}

/**
 * Make trip private: first set all public items private, then trip private.
 * Caller must obtain user confirmation before calling.
 */
export async function makeTripPrivate(
  supabase: SupabaseClient,
  tripId: string,
): Promise<void> {
  const { error: itemsError } = await supabase
    .from("items")
    .update({ visibility: "private" })
    .eq("trip_id", tripId)
    .eq("visibility", "public");

  if (itemsError) {
    throw new Error(itemsError.message ?? "Failed to privatize items");
  }

  const { error: tripError } = await supabase
    .from("trips")
    .update({ visibility: "private" })
    .eq("id", tripId);

  if (tripError) {
    throw new Error(tripError.message ?? "Failed to privatize trip");
  }
}

/** Deletes trip; related items are removed by DB ON DELETE CASCADE. */
export async function deleteTrip(
  supabase: SupabaseClient,
  tripId: string,
): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", tripId);

  if (error) {
    throw new Error(error.message ?? "Failed to delete trip");
  }
}
