"use server";

import { createClient } from "@/lib/supabase/server";
import {
  resolveRecentTripForUser,
  type RecentTripResolution,
} from "@/lib/trips/resolve-recent-trip";

/**
 * Session entry for the resolve_recent_trip tool.
 * Read-only. Does not create a trip or write shopping data.
 */
export async function resolveRecentTripForCurrentUser(input: {
  entry: "global" | "trip";
  currentTripId: string | null;
}): Promise<
  | { ok: true; resolution: RecentTripResolution }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "请先登录后再解析最近的旅行。" };
  }

  try {
    const resolution = await resolveRecentTripForUser(supabase, user.id, {
      entry: input.entry,
      currentTripId: input.currentTripId,
    });
    return { ok: true, resolution };
  } catch (err) {
    const message = err instanceof Error ? err.message : "解析最近旅行失败。";
    return { ok: false, error: message };
  }
}
