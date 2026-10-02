/**
 * F3-02 rule-assisted query parse — deterministic only (L-06 not closed).
 * Never invent Brand / Destination / 最近 / relative trip semantics.
 */

import { isCategorySlug, type CategorySlug } from "@/lib/category";
import type { OwnHistoryQuery } from "@/lib/history/types";

export type HistoryParseResult =
  | { status: "ok"; query: OwnHistoryQuery; summary: string }
  | { status: "blocked"; code: "L-01" | "L-03"; message: string }
  | { status: "ask"; message: string };

export type CompanionIntent = "record" | "history" | "ambiguous" | "none";

const HISTORY_CUE_RE =
  /(?:查(?:询|一下|找)?|买过|历史|我的记录|搜(?:索|一下)?|找一找|有没有买)/i;

const RECORD_CUE_RE =
  /(?:商品名称|价格|实付|花了|付了|录入|记一下|帮我记|写入|保存记录)/i;

const RECENT_RE = /最近/;
const RELATIVE_TRIP_RE = /上次去|第一次去|前几次/;
/** Destination-style cues without an explicit trip id — blocked under L-01. */
const DESTINATION_RE =
  /(?:去)?(?:日本|泰国|韩国|美国|中国|巴黎|东京|大阪|曼谷|首尔|京都|纽约|伦敦)(?:买|购|旅行|出差)?/;

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
  const history = HISTORY_CUE_RE.test(t);
  const record = RECORD_CUE_RE.test(t);
  if (history && record) return "ambiguous";
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
    // Avoid treating pure category words as product names when category hint exists
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
  if (parts.length === 0) return "你的全部购物记录（有限条数）";
  return parts.join("、");
}

/**
 * Parse natural language into OwnHistoryQuery.
 * Blocks L-01 / L-03 cues; asks when price lacks currency.
 */
export function parseOwnHistoryQuery(text: string): HistoryParseResult {
  const raw = text.trim();
  if (!raw) {
    return { status: "ask", message: "请说明要查询的商品、分类、地点、日期或旅行。" };
  }

  if (RECENT_RE.test(raw)) {
    return {
      status: "blocked",
      code: "L-03",
      message:
        "当前无法按「最近」查询（L-03 未关闭）。请改用明确日期范围、商品名、分类、地点或旅行。",
    };
  }

  if (RELATIVE_TRIP_RE.test(raw) || DESTINATION_RE.test(raw)) {
    return {
      status: "blocked",
      code: "L-01",
      message:
        "当前无法按目的地或相对旅行语义查询（L-01 未关闭）。请改用旅行选择、商品名、分类、地点或明确日期。",
    };
  }

  const query: OwnHistoryQuery = {};

  if (LIST_ALL_RE.test(raw)) {
    return {
      status: "ok",
      query,
      summary: summarize(query),
    };
  }

  const name = extractName(raw);
  if (name) query.name = name;

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
    /(?:地点|购买地点|在)\s*[:：]?\s*([A-Za-z0-9\u4e00-\u9fff][\w\u4e00-\u9fff ·-]{1,40})/,
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
      message: "请说明要查询的条件（商品名、分类、地点、日期、货币或旅行）。",
    };
  }

  if (!hasFilter && HISTORY_CUE_RE.test(raw) && !LIST_ALL_RE.test(raw)) {
    // e.g. "查一下" with no object — ask
    if (!/买过|防晒|美妆|食品|查询我的记录/.test(raw) && !name && !category) {
      return {
        status: "ask",
        message: "请补充要查找的商品名、分类或其他条件。也可说「查询我的记录」。",
      };
    }
  }

  // "买过防晒吗" → category only is enough
  if (!hasFilter) {
    return {
      status: "ask",
      message: "未能识别可用的查询条件。请使用商品名、分类、地点、日期或「查询我的记录」。",
    };
  }

  return { status: "ok", query, summary: summarize(query) };
}
