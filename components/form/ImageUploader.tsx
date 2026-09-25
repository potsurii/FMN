"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/foundation/Button";

type ImageUploaderProps = {
  variant?: "TripCoverImage" | "ProductImage";
  value: File | null;
  onChange: (file: File | null) => void;
  /** Existing remote image URL for edit mode */
  existingUrl?: string | null;
  /** Called when user clears existing/remote image without picking a new file */
  onClearExisting?: () => void;
  error?: string;
  disabled?: boolean;
};

export function ImageUploader({
  variant = "ProductImage",
  value,
  onChange,
  existingUrl = null,
  onClearExisting,
  error,
  disabled = false,
}: ImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const label = variant === "TripCoverImage" ? "旅行主图" : "商品图片";

  useEffect(() => {
    if (!value) {
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(value);
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const previewUrl = objectUrl ?? existingUrl;
  const hasPreview = Boolean(previewUrl);

  function handleFile(file: File | null) {
    onChange(file);
  }

  return (
    <div className="space-y-2">
      <div
        className={`overflow-hidden rounded-lg border border-dashed ${
          error ? "border-red-500/70" : "border-[var(--color-line)]"
        } bg-[var(--color-paper-muted)]`}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-stamp)] uppercase">
              Optional · Max 1
            </span>
            <span className="text-sm text-[var(--color-ink-muted)]">
              选择一张{label}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {hasPreview ? "更换图片" : "选择图片"}
        </Button>
        {hasPreview ? (
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              handleFile(null);
              onClearExisting?.();
            }}
          >
            移除
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
