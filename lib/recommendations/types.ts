export type RecommendationType = "recommend" | "not_recommend";

export type RecommendationRow = {
  id: string;
  user_id: string;
  item_id: string;
  type: RecommendationType;
  created_at: string;
  updated_at: string;
};

export type RecommendationCounts = {
  recommendCount: number;
  notRecommendCount: number;
};

export type RecommendationState = RecommendationType | null;
