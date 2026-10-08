/**
 * Resolve a Destination filter to a single Trip for relative-trip phrasing
 * ("上次去日本" / "第一次去日本") — by trip travel dates, not latest item.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sanitizeHistoryTerm,
  toHistoryIlikePattern,
} from "@/lib/history/sanitize";
import type { RelativeDestinationTripMode } from "@/lib/trips/destination-parse";

/**
 * Match trips.destination with case-insensitive contains (ILIKE %term%).
 * NULL destinations never match.
 */
export async function resolveRelativeDestinationTrip(
  supabase: SupabaseClient,
  userId: string,
  destination: string,
  mode: RelativeDestinationTripMode,
): Promise<string | null> {
  const term = sanitizeHistoryTerm(destination);
  if (!term) return null;

  const { data, error } = await supabase
    .from("trips")
    .select("id")
    .eq("user_id", userId)
    .ilike("destination", toHistoryIlikePattern(term))
    .order("start_date", { ascending: mode === "first" })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to resolve destination trip: ${error.message}`,
    );
  }

  return (data?.id as string | undefined) ?? null;
}
