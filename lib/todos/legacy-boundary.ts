/**
 * Legacy Todo detection (D2-06).
 *
 * Boundary is a fixed UTC timestamp supplied by Product Owner / deployment.
 * Do NOT invent or hardcode a placeholder timestamp.
 *
 * Set `FMN_LEGACY_TODO_BOUNDARY_UTC` (ISO 8601 UTC, e.g. `2026-10-01T00:00:00.000Z`)
 * when the value is known. Until then, Legacy/New classification is unavailable.
 */

export function getLegacyTodoBoundaryUtc(): string | null {
  const raw = process.env.FMN_LEGACY_TODO_BOUNDARY_UTC?.trim();
  if (!raw) return null;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

export type LegacyClassification = "legacy" | "new" | "unknown";

/**
 * Classify a Todo by created_at vs boundary.
 * Returns `unknown` when boundary is not configured (BLOCKED input).
 */
export function classifyTodoLegacy(
  createdAt: string,
): LegacyClassification {
  const boundary = getLegacyTodoBoundaryUtc();
  if (!boundary) return "unknown";
  const createdMs = Date.parse(createdAt);
  const boundaryMs = Date.parse(boundary);
  if (!Number.isFinite(createdMs) || !Number.isFinite(boundaryMs)) {
    return "unknown";
  }
  return createdMs < boundaryMs ? "legacy" : "new";
}

export function isLegacyTodo(createdAt: string): boolean | null {
  const c = classifyTodoLegacy(createdAt);
  if (c === "unknown") return null;
  return c === "legacy";
}
