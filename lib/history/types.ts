/**
 * F3-02 Own History — query filter types.
 * Brand remains unsupported. Destination uses trips.destination ILIKE.
 * 「最近」 is resolved to a Trip (L-03), not a date window.
 */

export type OwnHistoryQuery = {
  name?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  location?: string;
  /** Filter via trips.destination ILIKE %term%; NULL destinations do not match. */
  destination?: string;
  /**
   * With destination: resolve to one Trip by start_date
   * (latest = 上次去…, first = 第一次去…).
   */
  relativeDestinationTrip?: "latest" | "first";
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  tripId?: string;
  /** L-03: resolve to a started Trip that has Shopping Records. */
  recentTrip?: boolean;
};

export const OWN_HISTORY_LIMIT = 20;

export type OwnHistorySearchResult = {
  items: import("@/lib/items/types").ItemWithDisplay[];
  hasMore: boolean;
};
