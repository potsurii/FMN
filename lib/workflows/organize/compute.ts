/**
 * F3-03 pure organize transforms — no DB, no mutations.
 * Record Count and Quantity are never collapsed into one metric.
 * Amounts are never summed across currencies.
 */

import type { ItemWithDisplay } from "@/lib/items/types";
import { getCategoryLabel } from "@/lib/category";
import type {
  CurrencyTotal,
  OrganizeGroup,
  OrganizeGroupBy,
  OrganizeResultView,
  OrganizeSortBy,
  OrganizeSpec,
} from "./types";

function sortItems(
  items: ItemWithDisplay[],
  sortBy: OrganizeSortBy,
): ItemWithDisplay[] {
  const copy = [...items];
  copy.sort((a, b) => {
    switch (sortBy) {
      case "purchase_date_asc":
        return a.purchaseDate.localeCompare(b.purchaseDate);
      case "purchase_date_desc":
        return b.purchaseDate.localeCompare(a.purchaseDate);
      case "price_asc":
        if (a.currency !== b.currency) {
          return a.currency.localeCompare(b.currency);
        }
        return a.price - b.price;
      case "price_desc":
        if (a.currency !== b.currency) {
          return a.currency.localeCompare(b.currency);
        }
        return b.price - a.price;
      case "name_asc":
        return a.name.localeCompare(b.name, "zh");
      default:
        return 0;
    }
  });
  return copy;
}

export function aggregateByCurrency(
  items: ItemWithDisplay[],
): CurrencyTotal[] {
  const map = new Map<string, CurrencyTotal>();
  for (const item of items) {
    const currency = item.currency.trim().toUpperCase() || "UNK";
    const cur = map.get(currency) ?? {
      currency,
      totalAmount: 0,
      recordCount: 0,
      quantitySum: 0,
    };
    cur.totalAmount += item.price;
    cur.recordCount += 1;
    cur.quantitySum += item.quantity;
    map.set(currency, cur);
  }
  return [...map.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

function groupKeyLabel(
  item: ItemWithDisplay,
  groupBy: Exclude<OrganizeGroupBy, null>,
  tripNames?: Map<string, string>,
): { key: string; label: string } {
  if (groupBy === "category") {
    const key = item.category || "other";
    return { key, label: getCategoryLabel(key) };
  }
  if (groupBy === "currency") {
    const key = item.currency.trim().toUpperCase() || "UNK";
    return { key, label: key };
  }
  const key = item.tripId;
  const label = tripNames?.get(item.tripId) ?? `旅行 ${item.tripId.slice(0, 8)}…`;
  return { key, label };
}

export function buildOrganizeResult(
  itemsIn: ItemWithDisplay[],
  spec: OrganizeSpec,
  options?: { hasMore?: boolean; tripNames?: Map<string, string> },
): OrganizeResultView {
  const items = sortItems(itemsIn, spec.sortBy);
  const totalsByCurrency = aggregateByCurrency(items);
  const recordCount = items.length;
  const quantitySum = items.reduce((s, i) => s + i.quantity, 0);

  let groups: OrganizeGroup[] | null = null;
  if (spec.groupBy) {
    const bucket = new Map<string, OrganizeGroup>();
    for (const item of items) {
      const { key, label } = groupKeyLabel(item, spec.groupBy, options?.tripNames);
      const g = bucket.get(key) ?? {
        key,
        label,
        recordCount: 0,
        quantitySum: 0,
        totalsByCurrency: [],
        items: [],
      };
      g.items.push(item);
      g.recordCount += 1;
      g.quantitySum += item.quantity;
      bucket.set(key, g);
    }
    groups = [...bucket.values()].map((g) => ({
      ...g,
      totalsByCurrency: aggregateByCurrency(g.items),
    }));
    groups.sort((a, b) => a.label.localeCompare(b.label, "zh"));
  }

  return {
    summary: spec.summary,
    recordCount,
    quantitySum,
    totalsByCurrency: spec.aggregateTotalsByCurrency ? totalsByCurrency : [],
    groups,
    items,
    hasMore: Boolean(options?.hasMore),
  };
}
