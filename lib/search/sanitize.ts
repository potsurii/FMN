/** Strip ILIKE wildcards and limit length for safe pattern matching. */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .trim()
    .replace(/[%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export function toIlikePattern(term: string): string {
  return `%${term}%`;
}
