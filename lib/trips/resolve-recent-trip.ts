/**
 * L-03 server resolve — own trips + item counts, then pure resolveRecentTrip.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveRecentTrip,
  utcTodayIso,
  type RecentTripCandidate,
  type RecentTripContext,
  type RecentTripResolution,
} from "./recent-trip";

type TripLite = {
  id: string;
  name: string;
  start_date: string;
};

export async function resolveRecentTripForUser(
  supabase: SupabaseClient,
  userId: string,
  input: {
    entry: "global" | "trip";
    currentTripId?: string | null;
    todayIso?: string;
  },
): Promise<RecentTripResolution> {
  const todayIso = input.todayIso ?? utcTodayIso();

  const { data, error } = await supabase
    .from("trips")
    .select("id, name, start_date")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to load trips for 最近: ${error.message}`);
  }

  const trips = (data ?? []) as TripLite[];
  if (trips.length === 0) {
    return resolveRecentTrip(
      { entry: input.entry, currentTrip: null },
      [],
      todayIso,
    );
  }

  const tripIds = trips.map((t) => t.id);
  const { data: itemRows, error: itemError } = await supabase
    .from("items")
    .select("trip_id")
    .in("trip_id", tripIds);

  if (itemError) {
    throw new Error(`Failed to load trip records for 最近: ${itemError.message}`);
  }

  const countByTrip = new Map<string, number>();
  for (const row of itemRows ?? []) {
    const id = (row as { trip_id: string }).trip_id;
    countByTrip.set(id, (countByTrip.get(id) ?? 0) + 1);
  }

  const withCounts = trips.map((t) => ({
    id: t.id,
    name: t.name,
    startDate: t.start_date,
    itemCount: countByTrip.get(t.id) ?? 0,
  }));

  let currentTrip: RecentTripContext["currentTrip"] = null;
  if (input.entry === "trip" && input.currentTripId) {
    const found = withCounts.find((t) => t.id === input.currentTripId) ?? null;
    currentTrip = found;
  }

  return resolveRecentTrip(
    { entry: input.entry, currentTrip },
    withCounts,
    todayIso,
  );
}

export type { RecentTripCandidate, RecentTripResolution };
