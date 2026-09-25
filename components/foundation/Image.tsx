"use client";

import { useState } from "react";

type ImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
};

export function Image({ src, alt, className = "", fallback }: ImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[var(--color-paper-muted)] ${className}`}
        role="img"
        aria-label={alt}
      >
        {fallback ?? (
          <span className="font-stamp text-xs tracking-[0.2em] text-[var(--color-ink-muted)] uppercase">
            No Image
          </span>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
