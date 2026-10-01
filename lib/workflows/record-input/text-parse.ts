/**
 * Rule-assisted text → Draft field helpers for F3-01 Batch 1.
 *
 * L-06 LLM is NOT closed — this is NOT semantic NLU.
 * Only extract fields that can be matched with simple, verifiable patterns.
 * Never guess product names, locations, or ambiguous amounts.
 */

import { isCategorySlug, type CategorySlug } from "@/lib/category";
import { DEFAULT_QUANTITY, parseQuantity } from "@/lib/quantity";
import { todayIso } from "@/lib/items/validation";
import {
  createEmptyShoppingRecordDraft,
  type ShoppingRecordDraft,
} from "@/lib/companion/types";

const CURRENCY_CODE_RE =
  /\b(THB|JPY|USD|EUR|CNY|HKD|KRW|SGD|GBP|TWD|AUD|CAD|CHF|MYR|VND|IDR)\b/i;

/**
 * Price extraction requires an explicit amount keyword.
 * Bare digits (model numbers, qty, dates) must NEVER become Actual Paid Price.
 * "买了" is intentionally excluded — too ambiguous with purchase narrative.
 */
const PRICE_KEYWORD_AMOUNT_RE =
  /(?:价格|实付|花了|付了|花费|paid|price)\s*[:：]?\s*(?:[¥$€£฿]\s*)?(\d+(?:\.\d{1,2})?)/i;

const QTY_RE = /(?:数量|×|x|qty|quantity)\s*[:：=]?\s*(\d+)/i;

/** Unambiguous currency markers adjacent to an extracted amount window. */
const PRICE_CURRENCY_MARKER_RE =
  /(?:฿|日元|円|\bTHB\b|\bJPY\b|\bUSD\b|\bEUR\b|\bCNY\b|\bHKD\b|\bKRW\b|\bSGD\b|\bGBP\b|\bTWD\b)/i;

function currencyFromMarker(marker: string): string | null {
  const m = marker.trim().toUpperCase();
  if (m === "฿" || m === "THB") return "THB";
  if (m === "日元" || m === "円" || m === "JPY") return "JPY";
  if (/^[A-Z]{3}$/.test(m)) return m;
  return null;
}

/**
 * Extract Actual Paid Price only when a clear price keyword is present.
 * Returns null price when amount semantics are unclear — never guess.
 */
function extractExplicitPaidPrice(text: string): {
  price: number | null;
  currencyHint: string | null;
} {
  const match = text.match(PRICE_KEYWORD_AMOUNT_RE);
  if (!match || match.index === undefined) {
    return { price: null, currencyHint: null };
  }

  const n = Number(match[1]);
  if (!Number.isFinite(n) || n < 0) {
    return { price: null, currencyHint: null };
  }

  // Look for currency in a short window around the matched price phrase only.
  const start = Math.max(0, match.index);
  const end = Math.min(text.length, match.index + match[0].length + 12);
  const window = text.slice(start, end);
  const marker = window.match(PRICE_CURRENCY_MARKER_RE);
  const currencyHint = marker ? currencyFromMarker(marker[0]) : null;

  return { price: n, currencyHint };
}

const DATE_RE = /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/;

const CATEGORY_HINTS: Array<{ re: RegExp; slug: CategorySlug }> = [
  { re: /防晒|口红|护肤|美妆|cosmetic|beauty/i, slug: "beauty" },
  { re: /零食|食物|咖啡|food|snack/i, slug: "food" },
  { re: /衣服|鞋|包|fashion|衣/i, slug: "fashion" },
  { re: /首饰|珠宝|jewelry/i, slug: "jewelry" },
  { re: /日用品|洗漱|daily/i, slug: "daily" },
  { re: /电子|耳机|手机|electronics/i, slug: "electronics" },
];

export type TextParseHints = {
  tripId: string | null;
  tripLabel: string | null;
  tripStartDate?: string | null;
  tripEndDate?: string | null;
};

/**
 * Build a Draft from raw text using conservative rules + blanks for unknowns.
 */
export function buildShoppingRecordDraftFromText(
  sourceText: string,
  hints: TextParseHints,
): ShoppingRecordDraft {
  const text = sourceText.trim();
  const draft = createEmptyShoppingRecordDraft({
    sourceText: text,
    tripId: hints.tripId,
    tripLabel: hints.tripLabel,
    purchaseDateDefault: defaultPurchaseDate(hints),
  });

  const { price, currencyHint } = extractExplicitPaidPrice(text);
  if (price !== null) {
    draft.price = price;
  }

  // Currency: prefer marker next to an explicit price phrase; else ISO code in text.
  // Never invent currency when no reliable signal exists.
  if (currencyHint) {
    draft.currency = currencyHint;
  } else {
    const currencyMatch = text.match(CURRENCY_CODE_RE);
    if (currencyMatch) {
      draft.currency = currencyMatch[1].toUpperCase();
    }
  }

  const qtyMatch = text.match(QTY_RE);
  if (qtyMatch) {
    const q = parseQuantity(qtyMatch[1]);
    if (q !== null) draft.quantity = q;
    else draft.quantity = DEFAULT_QUANTITY;
  }

  const dateMatch = text.match(DATE_RE);
  if (dateMatch) {
    const y = dateMatch[1];
    const m = dateMatch[2].padStart(2, "0");
    const d = dateMatch[3].padStart(2, "0");
    const iso = `${y}-${m}-${d}`;
    if (
      hints.tripStartDate &&
      hints.tripEndDate &&
      (iso < hints.tripStartDate || iso > hints.tripEndDate)
    ) {
      // Do not guess out-of-range dates — leave for user.
    } else {
      draft.purchaseDate = iso;
    }
  }

  for (const hint of CATEGORY_HINTS) {
    if (hint.re.test(text) && isCategorySlug(hint.slug)) {
      draft.category = hint.slug;
      break;
    }
  }

  // Product name: only take an explicit "商品/名称：" prefix — never invent.
  const nameMatch = text.match(
    /(?:商品名称|商品|名称|产品)\s*[:：]\s*(.+?)(?:[，,。\n]|$)/,
  );
  if (nameMatch) {
    draft.name = nameMatch[1].trim();
  }

  // Location: only explicit labels — never guess.
  const locMatch = text.match(
    /(?:实际购买地点|购买地点|地点)\s*[:：]\s*(.+?)(?:[，,。\n]|$)/,
  );
  if (locMatch) {
    draft.location = locMatch[1].trim();
  }

  return draft;
}

function defaultPurchaseDate(hints: TextParseHints): string | null {
  const today = todayIso();
  if (hints.tripStartDate && hints.tripEndDate) {
    if (today < hints.tripStartDate) return hints.tripStartDate;
    if (today > hints.tripEndDate) return hints.tripEndDate;
    return today;
  }
  // Global entry without trip — still allow a date default; trip remains 未指定.
  return today;
}

export type DraftCompleteness = {
  complete: boolean;
  missing: string[];
};

export function getShoppingRecordDraftMissing(
  draft: ShoppingRecordDraft,
): DraftCompleteness {
  const missing: string[] = [];
  if (!draft.tripId) missing.push("Trip");
  if (!draft.name.trim()) missing.push("商品名称");
  if (draft.price === null || !Number.isFinite(draft.price)) {
    missing.push("实际支付价格");
  }
  if (!draft.currency) missing.push("货币");
  if (!draft.purchaseDate) missing.push("购买日期");
  if (parseQuantity(draft.quantity) === null) missing.push("数量");
  return { complete: missing.length === 0, missing };
}
