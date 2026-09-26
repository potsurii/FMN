import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchRecommendationCountsForItems } from "@/lib/recommendations/queries";
import { createSignedImageUrl } from "@/lib/storage/upload";
import {
  RECOMMENDED_ITEMS_LIMIT,
  RECOMMENDED_TRIPS_LIMIT,
  SEARCH_RESULT_LIMIT,
  type ItemSearchSort,
  type ProfileSearchResult,
  type PublicItemSearchResult,
  type PublicTripSearchResult,
} from "./types";
import { sanitizeSearchTerm, toIlikePattern } from "./sanitize";
import type { TravelStatus, Visibility } from "@/lib/trips/types";

const TRIP_SELECT =
  "id, user_id, name, start_date, end_date, main_image, visibility, travel_status, created_at";

const ITEM_SELECT =
  "id, trip_id, name, price, currency, location, purchase_date, category, image, note, visibility, created_at";

type TripRow = {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  main_image: string | null;
  visibility: Visibility;
  travel_status: TravelStatus;
  created_at: string;
};

type ItemRow = {
  id: string;
  trip_id: string;
  name: string;
  price: number | string;
  currency: string;
  location: string;
  purchase_date: string;
  category: string;
  image: string | null;
  visibility: Visibility;
  created_at: string;
};

function toNumber(value: number | string): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function mapPublicTrips(
  supabase: SupabaseClient,
  rows: TripRow[],
): Promise<PublicTripSearchResult[]> {
  return Promise.all(
    rows.map(async (row) => {
      const mainImageUrl = await createSignedImageUrl({
        supabase,
        bucket: "trip-images",
        path: row.main_image,
      });
      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        mainImagePath: row.main_image,
        mainImageUrl,
        visibility: row.visibility,
        travelStatus: row.travel_status,
        createdAt: row.created_at,
      };
    }),
  );
}

async function mapPublicItems(
  supabase: SupabaseClient,
  rows: Array<ItemRow & { user_id: string }>,
): Promise<PublicItemSearchResult[]> {
  const counts = await fetchRecommendationCountsForItems(
    supabase,
    rows.map((row) => row.id),
  );

  return Promise.all(
    rows.map(async (row) => {
      const imageUrl = await createSignedImageUrl({
        supabase,
        bucket: "item-images",
        path: row.image,
      });
      return {
        id: row.id,
        tripId: row.trip_id,
        userId: row.user_id,
        name: row.name,
        price: toNumber(row.price),
        currency: row.currency.trim().toUpperCase(),
        location: row.location,
        purchaseDate: row.purchase_date,
        category: row.category,
        imagePath: row.image,
        imageUrl,
        visibility: row.visibility,
        createdAt: row.created_at,
        recommendationCounts: counts.get(row.id) ?? {
          recommendCount: 0,
          notRecommendCount: 0,
        },
      };
    }),
  );
}

type ItemJoinRow = ItemRow & {
  trips: { visibility: string; user_id: string } | { visibility: string; user_id: string }[];
};

function flattenItemJoinRows(
  data: ItemJoinRow[] | null,
): Array<ItemRow & { user_id: string }> {
  return (data ?? []).map(({ trips, ...item }) => {
    const trip = Array.isArray(trips) ? trips[0] : trips;
    return {
      ...item,
      user_id: trip?.user_id ?? "",
    };
  }).filter((row) => Boolean(row.user_id));
}

function sortPublicItems(
  items: PublicItemSearchResult[],
  sort: ItemSearchSort,
): PublicItemSearchResult[] {
  const copy = [...items];
  if (sort === "price") {
    copy.sort((a, b) => a.price - b.price);
    return copy;
  }
  if (sort === "recommend") {
    copy.sort((a, b) => {
      const diff =
        b.recommendationCounts.recommendCount -
        a.recommendationCounts.recommendCount;
      if (diff !== 0) return diff;
      return b.purchaseDate.localeCompare(a.purchaseDate);
    });
    return copy;
  }
  copy.sort((a, b) => {
    const byDate = b.purchaseDate.localeCompare(a.purchaseDate);
    if (byDate !== 0) return byDate;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return copy;
}

/**
 * Recommended public trips for P6 empty state.
 * Rule: public only, created_at DESC, fixed limit. Not personalized.
 */
export async function listRecommendedPublicTrips(
  supabase: SupabaseClient,
  limit = RECOMMENDED_TRIPS_LIMIT,
): Promise<PublicTripSearchResult[]> {
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load recommended trips: ${error.message}`);
  }

  return mapPublicTrips(supabase, (data ?? []) as TripRow[]);
}

/** Public trips for a specific user (P8). */
export async function listPublicTripsByUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 24,
): Promise<PublicTripSearchResult[]> {
  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("user_id", userId)
    .eq("visibility", "public")
    .order("start_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load user public trips: ${error.message}`);
  }

  return mapPublicTrips(supabase, (data ?? []) as TripRow[]);
}

/**
 * Recommended public items for P6 empty state.
 * Rule: public item + public trip, purchase_date DESC, fixed limit.
 * Recommendation counts are display-only summaries.
 */
export async function listRecommendedPublicItems(
  supabase: SupabaseClient,
  limit = RECOMMENDED_ITEMS_LIMIT,
): Promise<PublicItemSearchResult[]> {
  const { data, error } = await supabase
    .from("items")
    .select(`${ITEM_SELECT}, trips!inner(visibility, user_id)`)
    .eq("visibility", "public")
    .eq("trips.visibility", "public")
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load recommended items: ${error.message}`);
  }

  return mapPublicItems(
    supabase,
    flattenItemJoinRows(data as unknown as ItemJoinRow[] | null),
  );
}

export async function searchPublicTrips(
  supabase: SupabaseClient,
  query: string,
  limit = SEARCH_RESULT_LIMIT,
): Promise<PublicTripSearchResult[]> {
  const term = sanitizeSearchTerm(query);
  if (!term) return [];

  const { data, error } = await supabase
    .from("trips")
    .select(TRIP_SELECT)
    .eq("visibility", "public")
    .ilike("name", toIlikePattern(term))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search trips: ${error.message}`);
  }

  return mapPublicTrips(supabase, (data ?? []) as TripRow[]);
}

export async function searchPublicItems(
  supabase: SupabaseClient,
  query: string,
  sort: ItemSearchSort = "latest",
  limit = SEARCH_RESULT_LIMIT,
): Promise<PublicItemSearchResult[]> {
  const term = sanitizeSearchTerm(query);
  if (!term) return [];

  const pattern = toIlikePattern(term);

  const [byName, byLocation] = await Promise.all([
    supabase
      .from("items")
      .select(`${ITEM_SELECT}, trips!inner(visibility, user_id)`)
      .eq("visibility", "public")
      .eq("trips.visibility", "public")
      .ilike("name", pattern)
      .limit(limit),
    supabase
      .from("items")
      .select(`${ITEM_SELECT}, trips!inner(visibility, user_id)`)
      .eq("visibility", "public")
      .eq("trips.visibility", "public")
      .ilike("location", pattern)
      .limit(limit),
  ]);

  if (byName.error) {
    throw new Error(`Failed to search items: ${byName.error.message}`);
  }
  if (byLocation.error) {
    throw new Error(`Failed to search items: ${byLocation.error.message}`);
  }

  const merged = new Map<string, ItemRow & { user_id: string }>();
  for (const row of flattenItemJoinRows([
    ...((byName.data ?? []) as unknown as ItemJoinRow[]),
    ...((byLocation.data ?? []) as unknown as ItemJoinRow[]),
  ])) {
    merged.set(row.id, row);
  }

  const mapped = await mapPublicItems(supabase, Array.from(merged.values()));
  return sortPublicItems(mapped, sort).slice(0, limit);
}

export async function searchProfiles(
  supabase: SupabaseClient,
  query: string,
  limit = SEARCH_RESULT_LIMIT,
): Promise<ProfileSearchResult[]> {
  const term = sanitizeSearchTerm(query);
  if (!term) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_path")
    .ilike("display_name", toIlikePattern(term))
    .order("display_name", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search profiles: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    displayName: (row.display_name as string | null) ?? null,
    avatarPath: (row.avatar_path as string | null) ?? null,
  }));
}
