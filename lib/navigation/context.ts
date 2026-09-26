/**
 * Lightweight navigation context via URL query params.
 * Does not use history.back() or global client state.
 */

export type ItemNavFrom = "search" | "trip";

export function tripHref(
  tripId: string,
  options?: { from?: "search" },
): string {
  if (options?.from === "search") {
    return `/trips/${tripId}?from=search`;
  }
  return `/trips/${tripId}`;
}

export function itemHref(
  tripId: string,
  itemId: string,
  options?: { from?: ItemNavFrom },
): string {
  const base = `/trips/${tripId}/items/${itemId}`;
  if (options?.from === "search") {
    return `${base}?from=search`;
  }
  if (options?.from === "trip") {
    // tripId is also in the path; query mirrors the product rule and
    // marks discovery context so back restores /trips/[id]?from=search.
    return `${base}?from=trip&tripId=${encodeURIComponent(tripId)}`;
  }
  return base;
}

export function parseNavFrom(raw: string | string[] | undefined): "search" | "trip" | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "search" || value === "trip") return value;
  return null;
}

export function resolveTripBack(from: "search" | "trip" | null): {
  href: string;
  label: string;
} {
  if (from === "search") {
    return { href: "/search", label: "返回搜索页" };
  }
  return { href: "/", label: "返回我的旅行" };
}

export function resolveItemBack(
  from: "search" | "trip" | null,
  tripId: string,
): { href: string; label: string } {
  if (from === "search") {
    return { href: "/search", label: "返回搜索页" };
  }
  if (from === "trip") {
    // Restore public-trip search context for P6 → P7 → P5 → P7 → P6.
    return {
      href: tripHref(tripId, { from: "search" }),
      label: "返回旅行详情",
    };
  }
  return { href: tripHref(tripId), label: "返回旅行详情" };
}

export function isSearchNavActive(
  pathname: string,
  from: "search" | "trip" | null,
): boolean {
  if (pathname === "/search" || pathname.startsWith("/search/")) return true;
  if (from === "search" || from === "trip") return true;
  return false;
}
