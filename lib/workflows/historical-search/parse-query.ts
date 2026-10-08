/**
 * F3-02 rule-assisted query parse — deterministic only (L-06 not closed).
 * Destination: trips.destination ILIKE. Brand remains unsupported.
 * 「最近」 → recentTrip (L-03), not a calendar window.
 */

import { isCategorySlug, type CategorySlug } from "@/lib/category";
import type { OwnHistoryQuery } from "@/lib/history/types";
import {
  detectRelativeDestinationTripMode,
  extractDestination,
  hasCalendarYearCue,
  hasSeveralTripsCue,
} from "@/lib/trips/destination-parse";

export type HistoryParseResult =
  | { status: "ok"; query: OwnHistoryQuery; summary: string }
  | { status: "blocked"; code: "L-01" | "L-03"; message: string }
  | { status: "ask"; message: string };

export type CompanionIntent =
  | "record"
  | "history"
  | "organize"
  | "todo"
  | "ambiguous"
  | "none";

const HISTORY_CUE_RE =
  /(?:查(?:询|一下|找)?|买过|历史|我的记录|搜(?:索|一下)?|找一找|有没有买)/i;

const RECORD_CUE_RE =
  /(?:商品名称|价格|实付|花了|付了|录入|记一下|帮我记|写入|保存记录)/i;

const ORGANIZE_CUE_RE =
  /整理|汇总|统计|按分类|按货币|分币种|总花费|帮我整理|分别统计|列出我买过/;

const TODO_CUE_RE =
  /帮我加(?:一个|条)?|加入代办|购物代办|准备买|计划买|创建代办|\btodo\b/i;

const RECENT_RE = /最近/;

const CURRENCY_RE =
  /\b(THB|JPY|USD|EUR|CNY|HKD|KRW|SGD|GBP|TWD|AUD|CAD)\b/i;

const PRICE_RE =
  /(?:价格|实付|花了|付了|花费|price|paid)\s*[:：]?\s*(?:[¥$€£฿]\s*)?(\d+(?:\.\d{1,2})?)/i;

const DATE_RE = /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/;

const UUID_RE =
  /\b([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/i;

const LIST_ALL_RE = /^(?:查询?我的记录|我的(?:购物)?记录|列出我的记录)$/i;

const CATEGORY_HINTS: Array<{ re: RegExp; slug: CategorySlug }> = [
  { re: /防晒|口红|护肤|美妆|cosmetic|beauty/i, slug: "beauty" },
  { re: /零食|食物|咖啡|food|snack/i, slug: "food" },
  { re: /衣服|鞋|包|fashion|衣/i, slug: "fashion" },
  { re: /首饰|珠宝|jewelry/i, slug: "jewelry" },
  { re: /日用品|洗漱|daily/i, slug: "daily" },
  { re: /电子|耳机|手机|electronics/i, slug: "electronics" },
];

const NAME_AFTER_CHA_RE =
  /查(?:询|一下|找)?\s*[:：]?\s*([A-Za-z0-9\u4e00-\u9fff][\w\u4e00-\u9fff ·-]{0,60})/;

const NAME_BOUGHT_RE =
  /买过\s*([A-Za-z0-9\u4e00-\u9fff][\w\u4e00-\u9fff ·-]{0,40}?)(?:吗|么|？|\?|$)/;

export function classifyCompanionIntent(text: string): CompanionIntent {
  const t = text.trim();
  if (!t) return "none";

  const organize = ORGANIZE_CUE_RE.test(t);
  const todo = TODO_CUE_RE.test(t);
  const history = HISTORY_CUE_RE.test(t);
  const record = RECORD_CUE_RE.test(t);

  const hits = [organize, todo, history, record].filter(Boolean).length;
  if (hits > 1) {
    if (organize && history && !todo && !record) return "organize";
    return "ambiguous";
  }
  if (organize) return "organize";
  if (todo) return "todo";
  if (history) return "history";
  if (record) return "record";
  return "none";
}

function pad2(n: string): string {
  return n.padStart(2, "0");
}

function extractDate(text: string): string | null {
  const m = text.match(DATE_RE);
  if (!m) return null;
  return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
}

function extractName(text: string): string | null {
  const a = text.match(NAME_AFTER_CHA_RE);
  if (a?.[1]) {
    const name = a[1].trim().replace(/[吗么？?]+$/, "");
    if (name && !CATEGORY_HINTS.some((h) => h.re.test(name) && name.length <= 4)) {
      return name.slice(0, 80);
    }
    if (name && !CATEGORY_HINTS.some((h) => h.re.test(name))) {
      return name.slice(0, 80);
    }
  }
  const b = text.match(NAME_BOUGHT_RE);
  if (b?.[1]) {
    const name = b[1].trim();
    if (name && !CATEGORY_HINTS.some((h) => h.re.test(name))) {
      return name.slice(0, 80);
    }
  }
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

function summarize(query: OwnHistoryQuery): string {
  const parts: string[] = [];
  if (query.name) parts.push(`商品「${query.name}」`);
  if (query.category) parts.push(`分类 ${query.category}`);
  if (query.destination) {
    if (query.relativeDestinationTrip === "latest") {
      parts.push(`上次「${query.destination}」旅行`);
    } else if (query.relativeDestinationTrip === "first") {
      parts.push(`第一次「${query.destination}」旅行`);
    } else {
      parts.push(`目的地「${query.destination}」`);
    }
  }
  if (query.location) parts.push(`地点「${query.location}」`);
  if (query.currency) parts.push(`货币 ${query.currency}`);
  if (query.minPrice != null || query.maxPrice != null) {
    parts.push(
      `价格 ${query.minPrice ?? "…"}–${query.maxPrice ?? "…"}`,
    );
  }
  if (query.purchaseDateFrom || query.purchaseDateTo) {
    parts.push(
      `日期 ${query.purchaseDateFrom ?? "…"} ~ ${query.purchaseDateTo ?? "…"}`,
    );
  }
  if (query.tripId) parts.push(`旅行 ${query.tripId.slice(0, 8)}…`);
  if (query.recentTrip) parts.push("最近一次已开始且有记录的旅行");
  if (parts.length === 0) return "你的全部购物记录（有限条数）";
  return parts.join("、");
}

/**
 * Parse natural language into OwnHistoryQuery.
 */
export function parseOwnHistoryQuery(text: string): HistoryParseResult {
  const raw = text.trim();
  if (!raw) {
    return { status: "ask", message: "请说明要查询的商品、分类、地点、日期或旅行。" };
  }

  if (hasSeveralTripsCue(raw)) {
    return {
      status: "ask",
      message:
        "「前几次」范围不明确。请改用「上次去…」「第一次去…」、目的地，或选择明确旅行。",
    };
  }

  if (hasCalendarYearCue(raw) && !extractDate(raw)) {
    return {
      status: "ask",
      message:
        "请使用明确的日历日期（例如 2025-01-10），当前不按「去年/前年/今年」自动推算年份。",
    };
  }

  const query: OwnHistoryQuery = {};

  if (RECENT_RE.test(raw)) {
    query.recentTrip = true;
  }

  if (LIST_ALL_RE.test(raw)) {
    return {
      status: "ok",
      query,
      summary: summarize(query),
    };
  }

  const destination = extractDestination(raw);
  if (destination) {
    query.destination = destination;
    const relative = detectRelativeDestinationTripMode(raw);
    if (relative) query.relativeDestinationTrip = relative;
  } else if (detectRelativeDestinationTripMode(raw)) {
    return {
      status: "ask",
      message: "请说明目的地，例如「上次去日本买了什么」。",
    };
  }

  const name = extractName(raw);
  if (
    name &&
    name !== destination &&
    !/^(什么|啥|哪些|什么东西)$/.test(name)
  ) {
    query.name = name;
  }

  const category = extractCategory(raw);
  if (category) query.category = category;

  const currencyMatch = raw.match(CURRENCY_RE);
  const priceMatch = raw.match(PRICE_RE);
  if (priceMatch) {
    const amount = Number(priceMatch[1]);
    if (Number.isFinite(amount)) {
      if (!currencyMatch) {
        return {
          status: "ask",
          message:
            "已识别价格条件，但未指定货币。请补充货币（如 THB / JPY），不会进行跨币种比较。",
        };
      }
      query.currency = currencyMatch[0].toUpperCase();
      query.minPrice = amount;
      query.maxPrice = amount;
    }
  } else if (currencyMatch) {
    query.currency = currencyMatch[0].toUpperCase();
  }

  const date = extractDate(raw);
  if (date) {
    query.purchaseDateFrom = date;
    query.purchaseDateTo = date;
  }

  const tripId = raw.match(UUID_RE)?.[1];
  if (tripId) query.tripId = tripId;

  const locMatch = raw.match(
    /(?:地点|购买地点)\s*[:：]?\s*([A-Za-z0-9\u4e00-\u9fff][\w\u4e00-\u9fff ·-]{1,40})/,
  );
  if (locMatch?.[1]) {
    query.location = locMatch[1].trim();
  }

  const hasFilter = Object.values(query).some(
    (v) => v !== undefined && v !== null && v !== "",
  );

  if (!hasFilter && !HISTORY_CUE_RE.test(raw)) {
    return {
      status: "ask",
      message: "请说明要查询的条件（商品名、分类、目的地、地点、日期、货币或旅行）。",
    };
  }

  if (!hasFilter && HISTORY_CUE_RE.test(raw) && !LIST_ALL_RE.test(raw)) {
    if (!/买过|防晒|美妆|食品|查询我的记录/.test(raw) && !name && !category) {
      return {
        status: "ask",
        message: "请补充要查找的商品名、分类或其他条件。也可说「查询我的记录」。",
      };
    }
  }

  if (!hasFilter) {
    return {
      status: "ask",
      message: "未能识别可用的查询条件。请使用商品名、分类、目的地、地点、日期或「查询我的记录」。",
    };
  }

  return { status: "ok", query, summary: summarize(query) };
}
