"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/foundation/Input";

type SearchInputProps = {
  initialQuery?: string;
  className?: string;
  placeholder?: string;
};

export function SearchInput({
  initialQuery = "",
  className = "",
  placeholder = "搜索商品、旅行或用户",
}: SearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = value.trim();
    if (!q) {
      router.push("/search");
      return;
    }
    const params = new URLSearchParams({ q });
    router.push(`/search?${params.toString()}`);
  }

  function handleClear() {
    setValue("");
    router.push("/search");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative ${className}`}
      role="search"
    >
      <span
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-ink-muted)]"
        aria-hidden
      >
        <SearchIcon />
      </span>
      <Input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="pr-20 pl-10"
        aria-label="搜索"
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          清除
        </button>
      ) : null}
    </form>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10.5 10.5L13.5 13.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
