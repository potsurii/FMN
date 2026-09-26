/**
 * Canonical share paths for public content (no nav query params).
 */

export function tripSharePath(tripId: string): string {
  return `/trips/${tripId}`;
}

export function itemSharePath(tripId: string, itemId: string): string {
  return `/trips/${tripId}/items/${itemId}`;
}

/** Absolute URL for clipboard; falls back to path on server. */
export function toAbsoluteShareUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}
