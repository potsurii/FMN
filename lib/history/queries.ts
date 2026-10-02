/**
 * F3-02 Own History DAL — read-only.
 * Ownership via trips.user_id + trips!inner; do not filter on visibility.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSignedImageUrl } from "@/lib/storage/upload";
import { mapItemRecord } from "@/lib/items/map";
import type { ItemRecord, ItemWithDisplay } from "@/lib/items/types";
import {
  OWN_HISTORY_LIMIT,
  type OwnHistoryQuery,
  type OwnHistorySearchResult,
} from "./types";
import { sanitizeHistoryTerm, toHistoryIlikePattern } from "./sanitize";

const ITEM_SELECT =
  "id, trip_id, name, price, currency, location, purchase_date, category, image, note, visibility, quantity, created_at";

type ItemJoinRow = ItemRecord & {
  trips: { user_id: string } | { user_id: string }[];
};

async function mapWithSignedUrl(
  supabase: SupabaseClient,
  row: ItemRecord,
): Promise<ItemWithDisplay> {
  const imageUrl = await createSignedImageUrl({
    supabase,
    bucket: "item-images",
    path: row.image,
  });
  return mapItemRecord(row, imageUrl);
}

/**
 * Search Shopping Records owned by the authenticated user.
 * Caller must pass the signed-in user id (from requireUser / getUser).
 */
export async function searchOwnItems(
  supabase: SupabaseClient,
  userId: string,
  query: OwnHistoryQuery,
): Promise<OwnHistorySearchResult> {
  const limit = OWN_HISTORY_LIMIT;
  const fetchLimit = limit + 1;

  let q = supabase
    .from("items")
    .select(`${ITEM_SELECT}, trips!inner(user_id)`)
    .eq("trips.user_id", userId)
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (query.name?.trim()) {
    const term = sanitizeHistoryTerm(query.name);
    if (term) {
      q = q.ilike("name", toHistoryIlikePattern(term));
    }
  }

  if (query.category?.trim()) {
    q = q.eq("category", query.category.trim());
  }

  if (query.currency?.trim()) {
    q = q.eq("currency", query.currency.trim().toUpperCase());
  }

  if (typeof query.minPrice === "number" && Number.isFinite(query.minPrice)) {
    q = q.gte("price", query.minPrice);
  }

  if (typeof query.maxPrice === "number" && Number.isFinite(query.maxPrice)) {
    q = q.lte("price", query.maxPrice);
  }

  if (query.location?.trim()) {
    const term = sanitizeHistoryTerm(query.location);
    if (term) {
      q = q.ilike("location", toHistoryIlikePattern(term));
    }
  }

  if (query.purchaseDateFrom?.trim()) {
    q = q.gte("purchase_date", query.purchaseDateFrom.trim());
  }

  if (query.purchaseDateTo?.trim()) {
    q = q.lte("purchase_date", query.purchaseDateTo.trim());
  }

  if (query.tripId?.trim()) {
    q = q.eq("trip_id", query.tripId.trim());
  }

  const { data, error } = await q;

  if (error) {
    throw new Error(`Failed to search own history: ${error.message}`);
  }

  const rows = ((data ?? []) as ItemJoinRow[]).map((row) => {
    const { trips: _ignored, ...item } = row;
    void _ignored;
    return item;
  });
  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const items = await Promise.all(
    slice.map((row) => mapWithSignedUrl(supabase, row)),
  );

  return { items, hasMore };
}
