"use server";

/**
 * F3-03 Organize — read-only server entry.
 * Reuses lib/history; never writes Shopping Records.
 */

import { createClient } from "@/lib/supabase/server";
import { searchOwnItems } from "@/lib/history/queries";
import { buildOrganizeResult } from "./compute";
import { parseOrganizeQuery } from "./parse-query";
import type { OrganizeResultView } from "./types";

const ORGANIZE_FETCH_LIMIT = 200;

export type RunOrganizeResult =
  | { ok: true; view: OrganizeResultView }
  | { ok: false; error: string; kind: "blocked" | "ask" | "auth" | "error" };

export async function runOrganize(input: {
  text: string;
  defaultTripId?: string | null;
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

  const spec = { ...parsed.spec };
  if (!spec.filter.tripId && input.defaultTripId) {
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
