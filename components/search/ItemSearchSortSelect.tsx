"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/form/Select";
import type { ItemSearchSort } from "@/lib/search/types";

const SORT_OPTIONS = [
  { value: "latest", label: "最新购买" },
  { value: "recommend", label: "推荐数量" },
  { value: "price", label: "价格" },
] as const;

type ItemSearchSortSelectProps = {
  query: string;
  sort: ItemSearchSort;
  className?: string;
};

export function ItemSearchSortSelect({
  query,
  sort,
  className = "",
}: ItemSearchSortSelectProps) {
  const router = useRouter();

  return (
    <div className={`w-full max-w-[11rem] ${className}`}>
      <label className="sr-only" htmlFor="item-search-sort">
        商品排序
      </label>
      <Select
        id="item-search-sort"
        options={[...SORT_OPTIONS]}
        value={sort}
        onChange={(event) => {
          const next = event.target.value as ItemSearchSort;
          const params = new URLSearchParams({ q: query, sort: next });
          router.push(`/search?${params.toString()}`);
        }}
      />
    </div>
  );
}
