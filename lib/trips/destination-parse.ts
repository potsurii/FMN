/**
 * Deterministic Destination cue extraction for F3-02 / F3-03.
 * Matching itself is always trips.destination ILIKE %term% (no synonym map).
 */

export type RelativeDestinationTripMode = "latest" | "first";

/** Calendar-year cues — not Destination; require explicit dates. */
const CALENDAR_YEAR_RE = /去年|前年|今年|上个月/;

/** Relative Destination Trip phrasing (product §14.2). */
const LAST_TRIP_RE = /上次去/;
const FIRST_TRIP_RE = /第一次去/;
const SEVERAL_TRIPS_RE = /前几次/;

/**
 * Explicit Destination field / place-before-shopping patterns.
 * Free-text match uses the extracted token as-is (no cross-language map).
 */
const EXPLICIT_DEST_RE =
  /目的地\s*[:：]?\s*([A-Za-z0-9\u4e00-\u9fff][\w\u4e00-\u9fff ·-]{0,40})/;

const GO_DEST_RE =
  /(?:上次去|第一次去|去)([A-Za-z0-9\u4e00-\u9fff]{1,20}?)(?:买|购|旅行|出差|的|$)/;

/**
 * Place immediately before shopping cues. Leading organize verbs are stripped
 * so "帮我整理日本的购物" → 日本 (not 帮我整理日本).
 */
const PLACE_SHOPPING_RE =
  /(?:帮我)?(?:整理|汇总|统计|查询?|列出|在)?([A-Za-z][A-Za-z\s-]{1,30}|[\u4e00-\u9fff]{2,8})(?:的购物|买过|买的|旅行买)/;

/** Common place tokens used only as extraction hints (not a Brand/destination vocabulary for inference). */
const PLACE_HINT_RE =
  /(?:日本|泰国|韩国|美国|中国|巴黎|东京|大阪|曼谷|首尔|京都|纽约|伦敦|北海道|冲绳|台北|香港|新加坡|Bangkok|Tokyo|Osaka|Paris|London|Seoul|Kyoto)/i;

export function hasCalendarYearCue(text: string): boolean {
  return CALENDAR_YEAR_RE.test(text);
}

export function hasSeveralTripsCue(text: string): boolean {
  return SEVERAL_TRIPS_RE.test(text);
}

export function detectRelativeDestinationTripMode(
  text: string,
): RelativeDestinationTripMode | null {
  if (LAST_TRIP_RE.test(text)) return "latest";
  if (FIRST_TRIP_RE.test(text)) return "first";
  return null;
}

export function extractDestination(text: string): string | null {
  const explicit = text.match(EXPLICIT_DEST_RE);
  if (explicit?.[1]) {
    return explicit[1].trim().slice(0, 80);
  }

  const go = text.match(GO_DEST_RE);
  if (go?.[1]) {
    const token = go[1].trim();
    if (token) return token.slice(0, 80);
  }

  // Prefer known place hints before open shopping patterns (avoids greedy capture).
  const hint = text.match(PLACE_HINT_RE);
  if (hint?.[0]) {
    return hint[0].trim().slice(0, 80);
  }

  const shopping = text.match(PLACE_SHOPPING_RE);
  if (shopping?.[1]) {
    const token = shopping[1].trim();
    if (
      token &&
      !/^(地点|购买地点|美妆|日用品|食品|衣服|最近|最近一次)$/.test(token)
    ) {
      return token.slice(0, 80);
    }
  }

  return null;
}
