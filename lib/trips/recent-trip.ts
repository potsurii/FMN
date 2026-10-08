/**
 * L-03 「最近」— not a time window.
 * 「最近」= latest started Trip that already has Shopping Records.
 * Ranking uses trips.start_date DESC only (not end_date, not item purchase_date).
 */

export const RECENT_TRIP_CANDIDATE_LIMIT = 5;

export const NO_RECENT_RECORD_TRIP_MESSAGE = "没有创建过有 record 的旅行";

export type RecentTripCandidate = {
  id: string;
  name: string;
  startDate: string;
};

export type RecentTripContext = {
  entry: "global" | "trip";
  currentTrip: {
    id: string;
    startDate: string;
    itemCount: number;
  } | null;
};

export type RecentTripResolution =
  | { status: "use"; tripId: string }
  | { status: "none"; message: string }
  | { status: "choose"; candidates: RecentTripCandidate[] };

/** Calendar date YYYY-MM-DD in UTC (trip dates are date columns, no time). */
export function utcTodayIso(nowMs: number = Date.now()): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

/** Started = start_date <= today. Does not use end_date or travel_status. */
export function isTripStarted(startDate: string, todayIso: string): boolean {
  return Boolean(startDate) && startDate <= todayIso;
}

export function isValidRecentCurrentTrip(
  context: RecentTripContext,
  todayIso: string,
): boolean {
  if (context.entry !== "trip" || !context.currentTrip) return false;
  if (!isTripStarted(context.currentTrip.startDate, todayIso)) return false;
  return context.currentTrip.itemCount > 0;
}

/**
 * Filter + sort candidates: started, has records, start_date DESC, max 5.
 * Caller supplies trips that already include itemCount.
 */
export function buildRecentTripCandidates(
  trips: Array<{
    id: string;
    name: string;
    startDate: string;
    itemCount: number;
  }>,
  todayIso: string,
  limit: number = RECENT_TRIP_CANDIDATE_LIMIT,
): RecentTripCandidate[] {
  return trips
    .filter((t) => isTripStarted(t.startDate, todayIso) && t.itemCount > 0)
    .sort((a, b) => {
      if (a.startDate === b.startDate) return 0;
      return a.startDate < b.startDate ? 1 : -1;
    })
    .slice(0, limit)
    .map((t) => ({
      id: t.id,
      name: t.name,
      startDate: t.startDate,
    }));
}

export function resolveRecentTrip(
  context: RecentTripContext,
  allTrips: Array<{
    id: string;
    name: string;
    startDate: string;
    itemCount: number;
  }>,
  todayIso: string,
): RecentTripResolution {
  if (isValidRecentCurrentTrip(context, todayIso) && context.currentTrip) {
    return { status: "use", tripId: context.currentTrip.id };
  }

  const candidates = buildRecentTripCandidates(allTrips, todayIso);

  if (candidates.length === 0) {
    return { status: "none", message: NO_RECENT_RECORD_TRIP_MESSAGE };
  }
  if (candidates.length === 1) {
    return { status: "use", tripId: candidates[0].id };
  }
  return { status: "choose", candidates };
}
