import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecommendationRow, RecommendationType } from "./types";

const REC_SELECT = "id, user_id, item_id, type, created_at, updated_at";

/**
 * Create or update the current user's feedback (switch type on same row).
 */
export async function upsertRecommendation(
  supabase: SupabaseClient,
  options: {
    userId: string;
    itemId: string;
    type: RecommendationType;
  },
): Promise<RecommendationRow> {
  const existing = await supabase
    .from("item_recommendations")
    .select(REC_SELECT)
    .eq("item_id", options.itemId)
    .eq("user_id", options.userId)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (existing.data) {
    const { data, error } = await supabase
      .from("item_recommendations")
      .update({ type: options.type })
      .eq("id", (existing.data as RecommendationRow).id)
      .eq("user_id", options.userId)
      .select(REC_SELECT)
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update recommendation");
    }
    return data as RecommendationRow;
  }

  const { data, error } = await supabase
    .from("item_recommendations")
    .insert({
      user_id: options.userId,
      item_id: options.itemId,
      type: options.type,
    })
    .select(REC_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create recommendation");
  }
  return data as RecommendationRow;
}

export async function deleteMyRecommendation(
  supabase: SupabaseClient,
  options: { userId: string; itemId: string },
): Promise<void> {
  const { error } = await supabase
    .from("item_recommendations")
    .delete()
    .eq("item_id", options.itemId)
    .eq("user_id", options.userId);

  if (error) {
    throw new Error(error.message ?? "Failed to cancel recommendation");
  }
}
