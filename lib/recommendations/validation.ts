import type { RecommendationType } from "./types";

export function isRecommendationType(
  value: string,
): value is RecommendationType {
  return value === "recommend" || value === "not_recommend";
}
