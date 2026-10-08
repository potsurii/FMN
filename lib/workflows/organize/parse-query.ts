/**
 * F3-03 rule-assisted organize parse — deterministic only.
 * Destination: trips.destination ILIKE. Brand remains unsupported.
 * 「最近」 → recentTrip (L-03), not a calendar window.
 * Brand = explicit 牌子/品牌 cues only (no brand vocabulary).
 */

import { isCategorySlug, type CategorySlug } from "@/lib/category";
import type { OwnHistoryQuery } from "@/lib/history/types";
import {
  detectRelativeDestinationTripMode,
  extractDestination,
  hasCalendarYearCue,
  hasSeveralTripsCue,
} from "@/lib/trips/destination-parse";
import type { OrganizeGroupBy, OrganizeSortBy, OrganizeSpec } from "./types";

export type OrganizeParseResult =
  | { status: "ok"; spec: OrganizeSpec }
  | { status: "blocked"; code: "L-01" | "L-03"; message: string }
  | { status: "ask"; message: string };

const RECENT_RE = /最近/;

/**
 * Explicit Brand-intent structural cues only.
 * No brand word list — bare product-like tokens (e.g. 资生堂 alone) do not trigger.
 */
const BRAND_INTENT_RE = /牌子|品牌/;

const CATEGORY_HINTS: Array<{ re: RegExp; slug: CategorySlug }> = [
  { re: /防晒|口红|护肤|美妆|cosmetic|beauty/i, slug: "beauty" },
  { re: /零食|食物|咖啡|food|snack/i, slug: "food" },
  { re: /衣服|鞋|包|fashion|衣/i, slug: "fashion" },
  { re: /首饰|珠宝|jewelry/i, slug: "jewelry" },
  { re: /日用品|洗漱|daily/i, slug: "daily" },
  { re: /电子|耳机|手机|electronics/i, slug: "electronics" },
];

const CURRENCY_RE =
  /\b(THB|JPY|USD|EUR|CNY|HKD|KRW|SGD|GBP|TWD|AUD|CAD)\b/i;

const CURRENCY_MARKER_RE =
  /(日元|円|฿|THB|JPY|USD|EUR|CNY|HKD|KRW|SGD|GBP|TWD|AUD|CAD)/i;

/** Approx / budget phrasing — must NOT become exact Organize price filters. */
const APPROX_PRICE_RE = /预算|大概|大约|左右|差不多|约\s*\d/;

const UUID_RE =
  /\b([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/i;

const DATE_RE = /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/;

function pad2(n: string): string {
  return n.padStart(2, "0");
}

function currencyFromMarker(marker: string): string | null {
  const m = marker.trim().toUpperCase();
  if (m === "฿" || m === "THB") return "THB";
  if (m === "日元" || m === "円" || m === "JPY") return "JPY";
  if (/^[A-Z]{3}$/.test(m)) return m;
  return null;
}

function extractCategory(text: string): CategorySlug | null {
  for (const h of CATEGORY_HINTS) {
    if (h.re.test(text)) return h.slug;
  }
  const slugMatch = text.match(
    /\b(beauty|food|fashion|jewelry|daily|electronics|other)\b/i,
  );
  if (slugMatch && isCategorySlug(slugMatch[1].toLowerCase())) {
    return slugMatch[1].toLowerCase() as CategorySlug;
  }
  return null;
}

function detectGroupBy(text: string): OrganizeGroupBy {
  if (/按分类|分组.*分类|分类整理|按品类/.test(text)) return "category";
  if (/按货币|分币种|每种货币|按币种/.test(text)) return "currency";
  if (/按旅行|按行程|分旅行/.test(text)) return "trip";
  if (/整理.*美妆|整理.*日用品|整理.*食品|按分类整理/.test(text)) {
    return "category";
  }
  return null;
}

function detectSort(text: string): OrganizeSortBy {
  // Avoid matching filter phrases like 价格高于 / 价格低于.
  if (/价格降序|从贵|贵到便宜|按价格从高/.test(text)) return "price_desc";
  if (/价格升序|从便宜|便宜到贵|按价格从低/.test(text)) return "price_asc";
  if (/名称|按名|字母/.test(text)) return "name_asc";
  if (/从晚|最新|日期降序|从近到远/.test(text)) return "purchase_date_desc";
  if (/从早|日期升序|时间顺序/.test(text)) return "purchase_date_asc";
  return "purchase_date_asc";
}

function wantsCurrencyTotals(text: string): boolean {
  return /总花费|统计|汇总|金额|按货币|分币种|每种货币/.test(text);
}

/**
 * Explicit numeric price filters for Organize (history query).
 * 以内 / 以下 here mean maxPrice — NOT Todo budget semantics.
 * Approx (预算 / 大概 / 左右) → no price filter (do not guess exact bounds).
 */
export function extractOrganizePriceFilter(text: string): {
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
} {
  if (APPROX_PRICE_RE.test(text)) {
    return {};
  }

  const range =
    text.match(
      /价格在?\s*(\d+(?:\.\d{1,2})?)\s*[-~～到至]\s*(\d+(?:\.\d{1,2})?)\s*(日元|円|฿|THB|JPY|USD|EUR|CNY|HKD|KRW|SGD|GBP|TWD|AUD|CAD)/i,
    ) ??
    text.match(
      /(\d+(?:\.\d{1,2})?)\s*[-~～到至]\s*(\d+(?:\.\d{1,2})?)\s*(日元|円|฿|THB|JPY|USD|EUR|CNY|HKD|KRW|SGD|GBP|TWD|AUD|CAD)\s*之间/i,
    );
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    const currency = currencyFromMarker(range[3]);
    if (Number.isFinite(a) && Number.isFinite(b) && currency) {
      return {
        minPrice: Math.min(a, b),
        maxPrice: Math.max(a, b),
        currency,
      };
    }
  }

  const minMatch = text.match(
    /价格(?:高于|大于|超过|不低于)\s*(\d+(?:\.\d{1,2})?)\s*(日元|円|฿|THB|JPY|USD|EUR|CNY|HKD|KRW|SGD|GBP|TWD|AUD|CAD)/i,
  );
  if (minMatch) {
    const n = Number(minMatch[1]);
    const currency = currencyFromMarker(minMatch[2]);
    if (Number.isFinite(n) && currency) {
      return { minPrice: n, currency };
    }
  }

  const maxKeyword = text.match(
    /价格(?:低于|小于|不超过|不高于)\s*(\d+(?:\.\d{1,2})?)\s*(日元|円|฿|THB|JPY|USD|EUR|CNY|HKD|KRW|SGD|GBP|TWD|AUD|CAD)/i,
  );
  if (maxKeyword) {
    const n = Number(maxKeyword[1]);
    const currency = currencyFromMarker(maxKeyword[2]);
    if (Number.isFinite(n) && currency) {
      return { maxPrice: n, currency };
    }
  }

  const maxSuffix = text.match(
    /(\d+(?:\.\d{1,2})?)\s*(日元|円|฿|THB|JPY|USD|EUR|CNY|HKD|KRW|SGD|GBP|TWD|AUD|CAD)\s*(?:以下|以内)/i,
  );
  if (maxSuffix) {
    const n = Number(maxSuffix[1]);
    const currency = currencyFromMarker(maxSuffix[2]);
    if (Number.isFinite(n) && currency) {
      return { maxPrice: n, currency };
    }
  }

  return {};
}

function summarize(filter: OwnHistoryQuery, groupBy: OrganizeGroupBy): string {
  const parts: string[] = [];
  if (filter.category) parts.push(`分类 ${filter.category}`);
  if (filter.destination) {
    if (filter.relativeDestinationTrip === "latest") {
      parts.push(`上次「${filter.destination}」旅行`);
    } else if (filter.relativeDestinationTrip === "first") {
      parts.push(`第一次「${filter.destination}」旅行`);
    } else {
      parts.push(`目的地「${filter.destination}」`);
    }
  }
  if (filter.currency) parts.push(`货币 ${filter.currency}`);
  if (filter.minPrice != null || filter.maxPrice != null) {
    const lo = filter.minPrice != null ? String(filter.minPrice) : "…";
    const hi = filter.maxPrice != null ? String(filter.maxPrice) : "…";
    parts.push(`价格 ${lo} ~ ${hi}`);
  }
  if (filter.location) parts.push(`地点「${filter.location}」`);
  if (filter.recentTrip) parts.push("最近一次已开始且有记录的旅行");
  if (filter.tripId) parts.push(`旅行已指定`);
  if (filter.purchaseDateFrom || filter.purchaseDateTo) {
    parts.push(
      `日期 ${filter.purchaseDateFrom ?? "…"} ~ ${filter.purchaseDateTo ?? "…"}`,
    );
  }
  if (groupBy) parts.push(`分组：${groupBy}`);
  if (parts.length === 0) return "整理全部自有购物记录";
  return parts.join("、");
}

export function parseOrganizeQuery(text: string): OrganizeParseResult {
  const raw = text.trim();
  if (!raw) {
    return {
      status: "ask",
      message: "请说明要整理的范围（分类、货币、旅行或日期）。",
    };
  }

  if (BRAND_INTENT_RE.test(raw)) {
    return {
      status: "blocked",
      code: "L-01",
      message:
        "当前不支持按品牌整理。请改用分类、地点、目的地、货币、明确旅行或日历日期。",
    };
  }

  if (hasSeveralTripsCue(raw)) {
    return {
      status: "ask",
      message:
        "「前几次」范围不明确。请改用「上次去…」「第一次去…」、目的地，或选择明确旅行。",
    };
  }

  const dateMatch = raw.match(DATE_RE);
  if (hasCalendarYearCue(raw) && !dateMatch) {
    return {
      status: "ask",
      message:
        "请使用明确的日历日期（例如 2025-01-10），当前不按「去年/前年/今年」自动推算年份。",
    };
  }

  const filter: OwnHistoryQuery = {};
  if (RECENT_RE.test(raw)) {
    filter.recentTrip = true;
  }
  const category = extractCategory(raw);
  if (category) filter.category = category;

  const destination = extractDestination(raw);
  if (destination) {
    filter.destination = destination;
    const relative = detectRelativeDestinationTripMode(raw);
    if (relative) filter.relativeDestinationTrip = relative;
  } else if (detectRelativeDestinationTripMode(raw)) {
    return {
      status: "ask",
      message: "请说明目的地，例如「整理上次去日本的购物」。",
    };
  }

  const priceFilter = extractOrganizePriceFilter(raw);
  if (priceFilter.minPrice != null) filter.minPrice = priceFilter.minPrice;
  if (priceFilter.maxPrice != null) filter.maxPrice = priceFilter.maxPrice;
  if (priceFilter.currency) {
    filter.currency = priceFilter.currency;
  } else {
    const currencyMatch =
      raw.match(CURRENCY_RE) ?? raw.match(CURRENCY_MARKER_RE);
    if (currencyMatch) {
      const c = currencyFromMarker(currencyMatch[0]);
      if (c) filter.currency = c;
    }
  }

  const tripId = raw.match(UUID_RE)?.[1];
  if (tripId) filter.tripId = tripId;

  if (dateMatch) {
    const iso = `${dateMatch[1]}-${pad2(dateMatch[2])}-${pad2(dateMatch[3])}`;
    filter.purchaseDateFrom = iso;
    filter.purchaseDateTo = iso;
  }

  const locMatch = raw.match(
    /(?:地点|购买地点)\s*[:：]?\s*([A-Za-z0-9\u4e00-\u9fff][\w\u4e00-\u9fff ·-]{1,40})/,
  );
  if (locMatch?.[1]) filter.location = locMatch[1].trim();

  const groupBy = detectGroupBy(raw);
  const sortBy = detectSort(raw);
  const aggregateTotalsByCurrency =
    wantsCurrencyTotals(raw) || groupBy === "currency";

  const hasSignal =
    Object.keys(filter).length > 0 ||
    groupBy !== null ||
    /整理|汇总|统计|列出/.test(raw);

  if (!hasSignal) {
    return {
      status: "ask",
      message:
        "请说明整理方式，例如「按分类整理美妆」「按货币分别统计总花费」「列出我买过的日用品」。",
    };
  }

  return {
    status: "ok",
    spec: {
      filter,
      groupBy,
      sortBy,
      aggregateTotalsByCurrency,
      summary: summarize(filter, groupBy),
    },
  };
}
