"use server";

import { createClient } from "@/lib/supabase/server";
import type { TripChoice } from "@/lib/workflows/orchestration/control";

/** Own trips for an explicit task-level pick. Does not auto-select. */
export async function listOwnTripChoices(): Promise<TripChoice[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("trips")
    .select("id, name")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });

  if (error || !data) return [];
  return data.flatMap((row) => {
    if (typeof row.id !== "string" || typeof row.name !== "string") return [];
    return [{ id: row.id, name: row.name }];
  });
}
