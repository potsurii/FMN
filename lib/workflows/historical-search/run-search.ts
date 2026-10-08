"use server";

/**
 * F3-02 Own History — read-only server entry.
 * Never writes formal Shopping Records.
 */

import { createClient } from "@/lib/supabase/server";
import { searchOwnItems } from "@/lib/history/queries";
import type { OwnHistoryQuery } from "@/lib/history/types";
import type { ItemWithDisplay } from "@/lib/items/types";
import { resolveRelativeDestinationTrip } from "@/lib/trips/resolve-destination-trip";
import { resolveRecentTripForUser } from "@/lib/trips/resolve-recent-trip";
import type { RecentTripCandidate } from "@/lib/trips/recent-trip";
import { NO_RECENT_RECORD_TRIP_MESSAGE } from "@/lib/trips/recent-trip";
import { parseOwnHistoryQuery } from "./parse-query";

export type RunOwnHistorySearchResult =
  | {
      ok: true;
      items: ItemWithDisplay[];
      hasMore: boolean;
      summary: string;
      query: OwnHistoryQuery;
    }
  | { ok: false; error: string; kind: "blocked" | "ask" | "auth" | "error" }
  | {
      ok: false;
      error: string;
      kind: "choose_trip";
      candidates: RecentTripCandidate[];
    };

export async function runOwnHistorySearch(input: {
  text: string;
  /** Optional default trip hint from Companion Context (not a permission boundary). */
  defaultTripId?: string | null;
  entry?: "global" | "trip";
  /** After L-03 candidate pick — execute immediately, no second confirm. */
  selectedTripId?: string | null;
}): Promise<RunOwnHistorySearchResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "请先登录后再查询历史记录。", kind: "auth" };
  }

  const parsed = parseOwnHistoryQuery(input.text);
  if (parsed.status === "blocked") {
    return { ok: false, error: parsed.message, kind: "blocked" };
  }
  if (parsed.status === "ask") {
    return { ok: false, error: parsed.message, kind: "ask" };
  }

  const query: OwnHistoryQuery = { ...parsed.query };

  if (query.recentTrip && !query.tripId) {
    if (input.selectedTripId) {
      query.tripId = input.selectedTripId;
      delete query.recentTrip;
    } else {
      try {
        const resolved = await resolveRecentTripForUser(supabase, user.id, {
          entry: input.entry ?? (input.defaultTripId ? "trip" : "global"),
          currentTripId: input.defaultTripId ?? null,
        });
        if (resolved.status === "none") {
          return {
            ok: false,
            error: resolved.message || NO_RECENT_RECORD_TRIP_MESSAGE,
            kind: "ask",
          };
        }
        if (resolved.status === "choose") {
          return {
            ok: false,
            error: "请选择一次旅行以查看最近的购物记录。",
            kind: "choose_trip",
            candidates: resolved.candidates,
          };
        }
        query.tripId = resolved.tripId;
        delete query.recentTrip;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "查询失败，请重试";
        return { ok: false, error: msg, kind: "error" };
      }
    }
  }

  // Relative Destination Trip → one Trip by travel dates (not latest item).
  if (query.relativeDestinationTrip && query.destination && !query.tripId) {
    try {
      const tripId = await resolveRelativeDestinationTrip(
        supabase,
        user.id,
        query.destination,
        query.relativeDestinationTrip,
      );
      if (!tripId) {
        return {
          ok: true,
          items: [],
          hasMore: false,
          summary: parsed.summary,
          query,
        };
      }
      query.tripId = tripId;
      // Trip already matched Destination; avoid double-filtering.
      delete query.destination;
      delete query.relativeDestinationTrip;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "查询失败，请重试";
      return { ok: false, error: msg, kind: "error" };
    }
  }

  // Context may supply a default trip filter only when the user did not specify
  // one, and not when L-03 「最近」 already resolved (or is asking to choose).
  if (!query.tripId && !parsed.query.recentTrip && input.defaultTripId) {
    query.tripId = input.defaultTripId;
  }

  if (query.tripId) {
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id")
      .eq("id", query.tripId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (tripError || !trip) {
      return {
        ok: false,
        error: "指定的旅行不存在或不属于当前用户。",
        kind: "error",
      };
    }
  }

  try {
    const { items, hasMore } = await searchOwnItems(supabase, user.id, query);
    return {
      ok: true,
      items,
      hasMore,
      summary: parsed.summary,
      query,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "查询失败，请重试";
    return { ok: false, error: msg, kind: "error" };
  }
}
