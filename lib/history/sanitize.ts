/**
 * Local sanitization for own-history ILIKE patterns.
 * Intentionally does NOT import from lib/search (public discovery isolation).
 */

/** Strip ILIKE wildcards and limit length for safe pattern matching. */
export function sanitizeHistoryTerm(raw: string): string {
  return raw
    .trim()
    .replace(/[%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function toHistoryIlikePattern(term: string): string {
  return `%${term}%`;
}
