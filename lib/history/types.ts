/**
 * F3-02 Own History — query filter types.
 * Allowed dimensions only (no Brand / Destination / 最近).
 */

export type OwnHistoryQuery = {
  name?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  location?: string;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  tripId?: string;
};

export const OWN_HISTORY_LIMIT = 20;

export type OwnHistorySearchResult = {
  items: import("@/lib/items/types").ItemWithDisplay[];
  hasMore: boolean;
};
