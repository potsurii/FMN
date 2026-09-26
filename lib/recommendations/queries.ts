import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RecommendationCounts,
  RecommendationRow,
  RecommendationState,
} from "./types";

const REC_SELECT = "id, user_id, item_id, type, created_at, updated_at";

export async function fetchRecommendationCounts(
  supabase: SupabaseClient,
  itemId: string,
): Promise<RecommendationCounts> {
  const { data, error } = await supabase
    .from("item_recommendations")
    .select("type")
    .eq("item_id", itemId);

  if (error) {
    throw new Error(`Failed to load recommendation counts: ${error.message}`);
  }

  let recommendCount = 0;
  let notRecommendCount = 0;
  for (const row of data ?? []) {
    if (row.type === "recommend") recommendCount += 1;
    else if (row.type === "not_recommend") notRecommendCount += 1;
  }

  return { recommendCount, notRecommendCount };
}

export async function fetchRecommendationCountsForItems(
  supabase: SupabaseClient,
  itemIds: string[],
): Promise<Map<string, RecommendationCounts>> {
  const map = new Map<string, RecommendationCounts>();
  for (const id of itemIds) {
    map.set(id, { recommendCount: 0, notRecommendCount: 0 });
  }
  if (itemIds.length === 0) return map;

  const { data, error } = await supabase
    .from("item_recommendations")
    .select("item_id, type")
    .in("item_id", itemIds);

  if (error) {
    throw new Error(`Failed to load recommendation counts: ${error.message}`);
  }

  for (const row of data ?? []) {
    const current = map.get(row.item_id) ?? {
      recommendCount: 0,
      notRecommendCount: 0,
    };
    if (row.type === "recommend") current.recommendCount += 1;
    else if (row.type === "not_recommend") current.notRecommendCount += 1;
    map.set(row.item_id, current);
  }

  return map;
}

export async function fetchMyRecommendation(
  supabase: SupabaseClient,
  itemId: string,
  userId: string,
): Promise<RecommendationState> {
  const { data, error } = await supabase
    .from("item_recommendations")
    .select(REC_SELECT)
    .eq("item_id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load recommendation: ${error.message}`);
  }

  if (!data) return null;
  return (data as RecommendationRow).type;
}
