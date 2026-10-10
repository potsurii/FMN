"use server";

/**
 * F3-03 Organize — read-only server entry.
 * Reuses lib/history; never writes Shopping Records.
 */

import { createClient } from "@/lib/supabase/server";
import { searchOwnItems } from "@/lib/history/queries";
import { resolveRelativeDestinationTrip } from "@/lib/trips/resolve-destination-trip";
import { resolveRecentTripForUser } from "@/lib/trips/resolve-recent-trip";
import type { RecentTripCandidate } from "@/lib/trips/recent-trip";
import { NO_RECENT_RECORD_TRIP_MESSAGE } from "@/lib/trips/recent-trip";
import { buildOrganizeResult } from "./compute";
import { parseOrganizeQuery } from "./parse-query";
import type { OrganizeResultView } from "./types";

const ORGANIZE_FETCH_LIMIT = 200;

export type RunOrganizeResult =
  | { ok: true; view: OrganizeResultView }
  | { ok: false; error: string; kind: "blocked" | "ask" | "auth" | "error" }
  | {
      ok: false;
      error: string;
      kind: "choose_trip";
      candidates: RecentTripCandidate[];
    };

export async function runOrganize(input: {
  text: string;
  defaultTripId?: string | null;
  entry?: "global" | "trip";
  selectedTripId?: string | null;
  /** Trip chosen for global「这次」 sorting. Does not auto-pick a single trip. */
  confirmedTripId?: string | null;
  /** Place already checked against the user sentence. */
  forcedDestination?: string | null;
}): Promise<RunOrganizeResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "请先登录后再整理购物记录。", kind: "auth" };
  }

  const parsed = parseOrganizeQuery(input.text);
  if (parsed.status === "blocked") {
    return { ok: false, error: parsed.message, kind: "blocked" };
  }
  if (parsed.status === "ask") {
    return { ok: false, error: parsed.message, kind: "ask" };
  }

  const spec = {
    ...parsed.spec,
    filter: { ...parsed.spec.filter },
  };

  if (input.forcedDestination?.trim()) {
    spec.filter.destination = input.forcedDestination.trim();
    if (!input.confirmedTripId) delete spec.filter.tripId;
  }
  if (input.confirmedTripId?.trim()) {
    spec.filter.tripId = input.confirmedTripId.trim();
    delete spec.filter.recentTrip;
  }

  if (spec.filter.recentTrip && !spec.filter.tripId) {
    if (input.selectedTripId) {
      spec.filter.tripId = input.selectedTripId;
      delete spec.filter.recentTrip;
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
            error: "请选择一次旅行以整理最近的购物记录。",
            kind: "choose_trip",
            candidates: resolved.candidates,
          };
        }
        spec.filter.tripId = resolved.tripId;
        delete spec.filter.recentTrip;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "整理失败，请重试";
        return { ok: false, error: msg, kind: "error" };
      }
    }
  }

  if (
    spec.filter.relativeDestinationTrip &&
    spec.filter.destination &&
    !spec.filter.tripId
  ) {
    try {
      const tripId = await resolveRelativeDestinationTrip(
        supabase,
        user.id,
        spec.filter.destination,
        spec.filter.relativeDestinationTrip,
      );
      if (!tripId) {
        return {
          ok: true,
          view: buildOrganizeResult([], spec, {
            hasMore: false,
            tripNames: new Map(),
          }),
        };
      }
      spec.filter.tripId = tripId;
      delete spec.filter.destination;
      delete spec.filter.relativeDestinationTrip;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "整理失败，请重试";
      return { ok: false, error: msg, kind: "error" };
    }
  }

  if (
    !spec.filter.tripId &&
    !parsed.spec.filter.recentTrip &&
    input.defaultTripId &&
    !input.forcedDestination?.trim()
  ) {
    spec.filter = { ...spec.filter, tripId: input.defaultTripId };
  }

  if (spec.filter.tripId) {
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id")
      .eq("id", spec.filter.tripId)
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
    const { items, hasMore } = await searchOwnItems(
      supabase,
      user.id,
      spec.filter,
      { limit: ORGANIZE_FETCH_LIMIT },
    );

    const tripIds = [...new Set(items.map((i) => i.tripId))];
    const tripNames = new Map<string, string>();
    if (tripIds.length > 0) {
      const { data: trips } = await supabase
        .from("trips")
        .select("id, name")
        .eq("user_id", user.id)
        .in("id", tripIds);
      for (const t of trips ?? []) {
        tripNames.set(t.id as string, t.name as string);
      }
    }

    const view = buildOrganizeResult(items, spec, { hasMore, tripNames });
    return { ok: true, view };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "整理失败，请重试";
    return { ok: false, error: msg, kind: "error" };
  }
}
