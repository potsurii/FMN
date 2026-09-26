import type { RecommendationCounts } from "@/lib/recommendations/types";
import type { TravelStatus, Visibility } from "@/lib/trips/types";

export type ItemSearchSort = "latest" | "recommend" | "price";

export type PublicTripSearchResult = {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  mainImagePath: string | null;
  mainImageUrl: string | null;
  visibility: Visibility;
  travelStatus: TravelStatus;
  createdAt: string;
};

export type PublicItemSearchResult = {
  id: string;
  tripId: string;
  /** Trip owner — publisher of the public item. */
  userId: string;
  name: string;
  price: number;
  currency: string;
  location: string;
  purchaseDate: string;
  category: string;
  imagePath: string | null;
  imageUrl: string | null;
  visibility: Visibility;
  createdAt: string;
  recommendationCounts: RecommendationCounts;
};

export type ProfileSearchResult = {
  id: string;
  displayName: string | null;
  avatarPath: string | null;
};

export const RECOMMENDED_TRIPS_LIMIT = 6;
export const RECOMMENDED_ITEMS_LIMIT = 8;
export const SEARCH_RESULT_LIMIT = 24;
