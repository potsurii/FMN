"use client";

import { useState } from "react";

type ItemImageProps = {
  src: string | null;
  alt: string;
  className?: string;
};

export function ItemImage({
  src,
  alt,
  className = "aspect-square",
}: ItemImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex w-full items-center justify-center bg-[linear-gradient(145deg,#f3efe6_0%,#e8e2d6_100%)] ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-stamp)] uppercase">
          No Photo
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`w-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
