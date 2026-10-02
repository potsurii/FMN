"use server";

/**
 * F3-02 Own History — read-only server entry.
 * Never writes formal Shopping Records.
 */

import { createClient } from "@/lib/supabase/server";
import { searchOwnItems } from "@/lib/history/queries";
import type { OwnHistoryQuery } from "@/lib/history/types";
import type { ItemWithDisplay } from "@/lib/items/types";
import { parseOwnHistoryQuery } from "./parse-query";

export type RunOwnHistorySearchResult =
  | {
      ok: true;
      items: ItemWithDisplay[];
      hasMore: boolean;
      summary: string;
      query: OwnHistoryQuery;
    }
  | { ok: false; error: string; kind: "blocked" | "ask" | "auth" | "error" };

export async function runOwnHistorySearch(input: {
  text: string;
  /** Optional default trip hint from Companion Context (not a permission boundary). */
  defaultTripId?: string | null;
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

  // Context may supply a default trip filter only when the user did not specify one.
  if (!query.tripId && input.defaultTripId) {
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
