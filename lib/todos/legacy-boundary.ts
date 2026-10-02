/**
 * Legacy Todo detection (D2-06).
 *
 * Boundary is a fixed UTC timestamp approved by Product Owner.
 * Runtime classification uses this TypeScript constant — not env vars,
 * not client local time, and not dynamic computation.
 */

/** Product Owner approved: 2026-10-02T00:00:00.000Z */
export const FMN_LEGACY_TODO_BOUNDARY_UTC = new Date(
  "2026-10-02T00:00:00.000Z",
);

export const FMN_LEGACY_TODO_BOUNDARY_UTC_ISO =
  "2026-10-02T00:00:00.000Z";

export type LegacyClassification = "legacy" | "new" | "unknown";

/** @deprecated Prefer FMN_LEGACY_TODO_BOUNDARY_UTC_ISO; kept for callers. */
export function getLegacyTodoBoundaryUtc(): string {
  return FMN_LEGACY_TODO_BOUNDARY_UTC_ISO;
}

/**
 * Classify a Todo by created_at vs boundary.
 * Invalid / unparseable dates return `"unknown"` (never mis-classify as `"new"`).
 */
export function classifyTodoLegacy(
  createdAt: string | Date,
): LegacyClassification {
  const created =
    createdAt instanceof Date ? createdAt : new Date(createdAt);

  if (Number.isNaN(created.getTime())) {
    return "unknown";
  }

  return created < FMN_LEGACY_TODO_BOUNDARY_UTC ? "legacy" : "new";
}

export function isLegacyTodo(createdAt: string | Date): boolean | null {
  const c = classifyTodoLegacy(createdAt);
  if (c === "unknown") return null;
  return c === "legacy";
}
