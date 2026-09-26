"use client";

import { useState } from "react";
import { Button } from "@/components/foundation/Button";
import { toAbsoluteShareUrl } from "@/lib/share/paths";

type ShareButtonProps = {
  /** App path to share, e.g. /trips/[id] — page decides public eligibility. */
  path: string;
  className?: string;
};

/**
 * Copies a public content link. Does not check visibility — caller must gate.
 */
export function ShareButton({ path, className = "" }: ShareButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    const url = toAbsoluteShareUrl(path);

    function fallbackCopy() {
      const input = document.createElement("input");
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(input);
      if (!ok) throw new Error("copy failed");
    }

    try {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          fallbackCopy();
        }
      } catch {
        fallbackCopy();
      }
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2500);
    }
  }

  return (
    <div className={className}>
      <Button type="button" variant="secondary" onClick={handleCopy}>
        {status === "copied"
          ? "已复制链接"
          : status === "error"
            ? "复制失败"
            : "复制分享链接"}
      </Button>
    </div>
  );
}
