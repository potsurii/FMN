/**
 * F3-03 Organize — types for filter/group/sort/aggregate (workflow layer).
 * Aggregation rules live here, not in UI components.
 */

import type { OwnHistoryQuery } from "@/lib/history/types";
import type { ItemWithDisplay } from "@/lib/items/types";

export type OrganizeGroupBy = "category" | "currency" | "trip" | null;

export type OrganizeSortBy =
  | "purchase_date_asc"
  | "purchase_date_desc"
  | "price_asc"
  | "price_desc"
  | "name_asc";

export type OrganizeSpec = {
  filter: OwnHistoryQuery;
  groupBy: OrganizeGroupBy;
  sortBy: OrganizeSortBy;
  /** When true, compute per-currency totals (never cross-currency). */
  aggregateTotalsByCurrency: boolean;
  summary: string;
};

export type CurrencyTotal = {
  currency: string;
  /** Sum of item.price (one Shopping Record = one row contribution). */
  totalAmount: number;
  recordCount: number;
  /** Sum of item.quantity — separate from recordCount. */
  quantitySum: number;
};

export type OrganizeGroup = {
  key: string;
  label: string;
  recordCount: number;
  quantitySum: number;
  totalsByCurrency: CurrencyTotal[];
  items: ItemWithDisplay[];
};

export type OrganizeResultView = {
  summary: string;
  /** Distinct Shopping Records (rows). */
  recordCount: number;
  /** Sum of quantity fields across records. */
  quantitySum: number;
  totalsByCurrency: CurrencyTotal[];
  groups: OrganizeGroup[] | null;
  items: ItemWithDisplay[];
  hasMore: boolean;
};
