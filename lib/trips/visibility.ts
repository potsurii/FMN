import type { Visibility } from "@/lib/trips/types";

export function countPublicItems(
  items: { visibility: Visibility }[],
): number {
  return items.filter((item) => item.visibility === "public").length;
}
