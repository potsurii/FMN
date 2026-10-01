"use client";

import { Button } from "@/components/foundation/Button";

type CompanionLauncherProps = {
  entry: "global" | "trip";
  tripName?: string | null;
  onOpen: () => void;
};

export function CompanionLauncher({
  entry,
  tripName,
  onOpen,
}: CompanionLauncherProps) {
  const label =
    entry === "trip"
      ? tripName
        ? `Companion · ${tripName}`
        : "Companion · 当前旅行"
      : "FMN Companion";

  return (
    <div className="fixed bottom-5 right-4 z-40 md:bottom-8 md:right-8">
      <Button
        type="button"
        onClick={onOpen}
        className="shadow-[0_10px_28px_rgba(45,42,38,0.16)]"
        aria-label="打开 FMN Companion"
      >
        {label}
      </Button>
    </div>
  );
}
