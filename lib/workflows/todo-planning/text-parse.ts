/**
 * F3-04 rule-assisted text → Shopping Todo Draft.
 * L-06 LLM not closed — deterministic patterns only.
 *
 * Price semantics (critical):
 * - Concrete amount + currency (e.g. "3000 日元") → may set reference_price
 * - Budget / range / approx ("预算", "大概", "以内", …) → ask; never invent price
 */

import { isCategorySlug, type CategorySlug } from "@/lib/category";
import {
  createEmptyShoppingTodoDraft,
  type ShoppingTodoDraft,
} from "@/lib/companion/types";
import { DEFAULT_QUANTITY, parseQuantity } from "@/lib/quantity";

const CURRENCY_CODE_RE =
  /\b(THB|JPY|USD|EUR|CNY|HKD|KRW|SGD|GBP|TWD|AUD|CAD|CHF|MYR|VND|IDR)\b/i;

const CONCRETE_AMOUNT_CURRENCY_RE =
  /(\d+(?:\.\d{1,2})?)\s*(日元|円|฿|THB|JPY|USD|EUR|CNY|HKD|KRW|SGD|GBP|TWD|AUD|CAD)/i;

const REF_PRICE_KEYWORD_RE =
  /(?:参考价|参考价格|价格|reference\s*price)\s*[:：]?\s*(?:[¥$€£฿]\s*)?(\d+(?:\.\d{1,2})?)/i;

const QTY_RE = /(?:数量|×|x|qty|quantity)\s*[:：=]?\s*(\d+)/i;

const LOCATION_RE =
  /(?:在|地点|计划购买地点|购买地点)\s*[:：]?\s*([A-Za-z0-9\u4e00-\u9fff][\w\u4e00-\u9fff ·-]{0,40}?)(?:买|购买|$|，|,|。)/;

const PRODUCT_AFTER_ADD_RE =
  /(?:帮我加(?:一个|条)?|加入代办|创建代办|准备买|计划买)\s*[:：]?\s*([A-Za-z0-9\u4e00-\u9fff][\w\u4e00-\u9fff ·.-]{0,60})/;

const PRODUCT_NAME_LABEL_RE =
  /(?:商品名称|商品|产品)\s*[:：]\s*([A-Za-z0-9\u4e00-\u9fff][\w\u4e00-\u9fff ·.-]{0,60})/;

const CATEGORY_HINTS: Array<{ re: RegExp; slug: CategorySlug }> = [
  { re: /防晒|口红|护肤|美妆|cosmetic|beauty/i, slug: "beauty" },
  { re: /零食|食物|咖啡|food|snack/i, slug: "food" },
  { re: /衣服|鞋|包|fashion|衣/i, slug: "fashion" },
  { re: /首饰|珠宝|jewelry/i, slug: "jewelry" },
  { re: /日用品|洗漱|daily/i, slug: "daily" },
  { re: /电子|耳机|手机|electronics/i, slug: "electronics" },
];

function currencyFromMarker(marker: string): string | null {
  const m = marker.trim().toUpperCase();
  if (m === "฿" || m === "THB") return "THB";
  if (m === "日元" || m === "円" || m === "JPY") return "JPY";
  if (/^[A-Z]{3}$/.test(m)) return m;
  return null;
}

export type TodoParseHints = {
  tripId: string | null;
  tripLabel: string | null;
};

export type TodoParseResult =
  | { status: "ok"; draft: ShoppingTodoDraft }
  | { status: "ask"; message: string; draft?: ShoppingTodoDraft };

/**
 * Detect budget / range / approx phrasing that must not become reference_price.
 * Keywords must share the same clause as a number and lie within ≤10 characters.
 */
const BUDGET_KEYWORDS = [
  "预算",
  "大概",
  "大约",
  "左右",
  "以内",
  "以下",
  "不超过",
  "上下",
  "差不多",
] as const;

export function hasNonConcretePriceSemantics(text: string): boolean {
  if (/约\s*\d/.test(text)) {
    return true;
  }

  const clauses = text.split(/[，,。；;、\n]+/);
  for (const clause of clauses) {
    const numMatch = clause.match(/\d+(?:\.\d{1,2})?/);
    if (!numMatch || numMatch.index === undefined) continue;
    const numStart = numMatch.index;
    const numEnd = numStart + numMatch[0].length;

    for (const kw of BUDGET_KEYWORDS) {
      let from = 0;
      while (from < clause.length) {
        const i = clause.indexOf(kw, from);
        if (i < 0) break;
        const kwEnd = i + kw.length;
        const dist =
          i >= numEnd
            ? i - numEnd
            : numStart >= kwEnd
              ? numStart - kwEnd
              : 0;
        if (dist <= 10) return true;
        from = i + 1;
      }
    }
  }
  return false;
}

function extractConcreteReferencePrice(text: string): {
  price: number | null;
  currency: string | null;
  blockedAsBudget: boolean;
} {
  if (hasNonConcretePriceSemantics(text)) {
    return { price: null, currency: null, blockedAsBudget: true };
  }

  const keyword = text.match(REF_PRICE_KEYWORD_RE);
  if (keyword) {
    const n = Number(keyword[1]);
    if (Number.isFinite(n) && n >= 0) {
      const code = text.match(CURRENCY_CODE_RE)?.[0];
      const marker = text.match(
        /(?:日元|円|฿|\bTHB\b|\bJPY\b|\bUSD\b|\bEUR\b|\bCNY\b)/i,
      );
      const currency =
        (code ? code.toUpperCase() : null) ??
        (marker ? currencyFromMarker(marker[0]) : null);
      return { price: n, currency, blockedAsBudget: false };
    }
  }

  const adjacent = text.match(CONCRETE_AMOUNT_CURRENCY_RE);
  if (adjacent) {
    const n = Number(adjacent[1]);
    if (Number.isFinite(n) && n >= 0) {
      return {
        price: n,
        currency: currencyFromMarker(adjacent[2]),
        blockedAsBudget: false,
      };
    }
  }

  return { price: null, currency: null, blockedAsBudget: false };
}

function extractProductName(text: string): string {
  const labeled = text.match(PRODUCT_NAME_LABEL_RE);
  if (labeled?.[1]) return labeled[1].trim().replace(/[，,。].*$/, "").trim();

  const afterAdd = text.match(PRODUCT_AFTER_ADD_RE);
  if (afterAdd?.[1]) {
    let name = afterAdd[1].trim();
    // Stop before price / location clauses
    name = name
      .replace(/[，,].*$/, "")
      .replace(/\d+(?:\.\d{1,2})?\s*(?:日元|円|฿|THB|JPY|USD|EUR|CNY).*$/i, "")
      .replace(/在.+$/, "")
      .trim();
    return name;
  }
  return "";
}

function extractLocation(text: string): string {
  const m = text.match(LOCATION_RE);
  return m?.[1]?.trim() ?? "";
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

export function buildShoppingTodoDraftFromText(
  text: string,
  hints: TodoParseHints,
): TodoParseResult {
  const raw = text.trim();
  const draft = createEmptyShoppingTodoDraft({
    sourceText: raw,
    tripId: hints.tripId,
    tripLabel: hints.tripLabel,
  });

  const priceInfo = extractConcreteReferencePrice(raw);
  if (priceInfo.blockedAsBudget) {
    return {
      status: "ask",
      message:
        "检测到「预算 / 大概 / 以内」等非具体参考价表述。正式 Todo 的 reference_price 必须是具体参考价格，不能用预算或范围代替。请提供具体参考价格与货币（例如：3000 日元）。",
    };
  }

  draft.name = extractProductName(raw);
  draft.referencePrice = priceInfo.price;
  draft.referenceCurrency = priceInfo.currency;
  draft.referenceLocation = extractLocation(raw);
  draft.category = extractCategory(raw);

  const qty = raw.match(QTY_RE);
  if (qty) {
    const n = parseQuantity(qty[1]);
    if (n !== null) draft.quantity = n;
  } else {
    draft.quantity = DEFAULT_QUANTITY;
  }

  if (!draft.name && !draft.referencePrice && !draft.referenceLocation) {
    return {
      status: "ask",
      message:
        "请说明代办内容，例如：「帮我加一个 Anessa，3000 日元，在松本清买」。",
    };
  }

  return { status: "ok", draft };
}

export type TodoDraftCompleteness = {
  complete: boolean;
  missing: string[];
};

/** Phase 3 New Todo required fields — application / workflow layer only. */
export function getShoppingTodoDraftMissing(
  draft: ShoppingTodoDraft,
): TodoDraftCompleteness {
  const missing: string[] = [];
  if (!draft.tripId) missing.push("Trip");
  if (!draft.name.trim()) missing.push("商品名称");
  if (
    draft.referencePrice === null ||
    !Number.isFinite(draft.referencePrice)
  ) {
    missing.push("参考价格（具体值）");
  }
  if (!draft.referenceCurrency) missing.push("参考货币");
  if (!draft.referenceLocation.trim()) missing.push("计划购买地点");
  if (parseQuantity(draft.quantity) === null) missing.push("数量");
  return { complete: missing.length === 0, missing };
}
