"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FmnInput } from "@/components/ui/fmn-input";

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
        className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-paper/70"
        aria-hidden
      >
        <SearchIcon />
      </span>
      <FmnInput
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="border-paper/55 pr-16 pl-7 text-paper-hi placeholder:text-paper/45 focus:border-paper-hi focus:bg-paper/10"
        aria-label="搜索"
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-1/2 right-0 -translate-y-1/2 font-mono text-[0.72rem] text-paper/70 hover:text-paper-hi"
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
