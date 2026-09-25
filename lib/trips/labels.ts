import type { TravelStatus, Visibility } from "@/lib/trips/types";

export function visibilityLabel(visibility: Visibility): string {
  return visibility === "public" ? "公开" : "私密";
}

export function travelStatusLabel(status: TravelStatus): string {
  switch (status) {
    case "upcoming":
      return "即将出行";
    case "active":
      return "进行中";
    case "ended":
      return "已结束";
  }
}
