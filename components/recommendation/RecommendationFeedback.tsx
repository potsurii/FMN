"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/foundation/Button";
import { Text } from "@/components/foundation/Text";
import { createClient } from "@/lib/supabase/client";
import {
  deleteMyRecommendation,
  upsertRecommendation,
} from "@/lib/recommendations/mutations";
import type {
  RecommendationCounts,
  RecommendationState,
  RecommendationType,
} from "@/lib/recommendations/types";

type RecommendationFeedbackProps = {
  variant: "interactive" | "summary";
  itemId: string;
  userId?: string;
  initialCounts: RecommendationCounts;
  initialMyState?: RecommendationState;
  className?: string;
};

export function RecommendationFeedback({
  variant,
  itemId,
  userId,
  initialCounts,
  initialMyState = null,
  className = "",
}: RecommendationFeedbackProps) {
  if (variant === "summary") {
    return (
      <RecommendationSummary counts={initialCounts} className={className} />
    );
  }

  if (!userId) {
    return (
      <RecommendationSummary counts={initialCounts} className={className} />
    );
  }

  return (
    <RecommendationInteractive
      itemId={itemId}
      userId={userId}
      initialCounts={initialCounts}
      initialMyState={initialMyState}
      className={className}
    />
  );
}

function RecommendationSummary({
  counts,
  className = "",
}: {
  counts: RecommendationCounts;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-ink-muted)] ${className}`}
      aria-label="推荐反馈数量"
    >
      <span>
        推荐{" "}
        <span className="font-medium text-[var(--color-ink)]">
          {counts.recommendCount}
        </span>
      </span>
      <span>
        不推荐{" "}
        <span className="font-medium text-[var(--color-ink)]">
          {counts.notRecommendCount}
        </span>
      </span>
    </div>
  );
}

function RecommendationInteractive({
  itemId,
  userId,
  initialCounts,
  initialMyState,
  className = "",
}: {
  itemId: string;
  userId: string;
  initialCounts: RecommendationCounts;
  initialMyState: RecommendationState;
  className?: string;
}) {
  const router = useRouter();
  const [counts, setCounts] = useState(initialCounts);
  const [myState, setMyState] = useState<RecommendationState>(initialMyState);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function applyType(next: RecommendationType) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    const previousState = myState;
    const previousCounts = counts;

    // Optimistic UI
    const nextCounts = { ...counts };
    if (previousState === "recommend") nextCounts.recommendCount -= 1;
    if (previousState === "not_recommend") nextCounts.notRecommendCount -= 1;
    if (next === "recommend") nextCounts.recommendCount += 1;
    if (next === "not_recommend") nextCounts.notRecommendCount += 1;
    setMyState(next);
    setCounts(nextCounts);

    try {
      const supabase = createClient();
      await upsertRecommendation(supabase, { userId, itemId, type: next });
      setMessage(next === "recommend" ? "已推荐" : "已标记不推荐");
      router.refresh();
    } catch (err) {
      setMyState(previousState);
      setCounts(previousCounts);
      setError(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setBusy(false);
    }
  }

  async function cancelFeedback() {
    if (busy || !myState) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    const previousState = myState;
    const previousCounts = counts;
    const nextCounts = { ...counts };
    if (previousState === "recommend") nextCounts.recommendCount -= 1;
    if (previousState === "not_recommend") nextCounts.notRecommendCount -= 1;
    setMyState(null);
    setCounts(nextCounts);

    try {
      const supabase = createClient();
      await deleteMyRecommendation(supabase, { userId, itemId });
      setMessage("已取消反馈");
      router.refresh();
    } catch (err) {
      setMyState(previousState);
      setCounts(previousCounts);
      setError(err instanceof Error ? err.message : "取消失败，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="font-stamp text-[10px] tracking-[0.18em] text-[var(--color-ink-muted)] uppercase">
        Recommendation
      </p>
      <Text className="text-sm text-[var(--color-ink-muted)]">
        这条购物信息是否值得参考？
      </Text>
      <RecommendationSummary counts={counts} />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={myState === "recommend" ? "primary" : "secondary"}
          disabled={busy}
          onClick={() => applyType("recommend")}
          aria-pressed={myState === "recommend"}
        >
          {myState === "recommend" ? "✓ 已推荐" : "推荐"}
        </Button>
        <Button
          type="button"
          variant={myState === "not_recommend" ? "primary" : "secondary"}
          disabled={busy}
          onClick={() => applyType("not_recommend")}
          aria-pressed={myState === "not_recommend"}
        >
          {myState === "not_recommend" ? "✓ 已不推荐" : "不推荐"}
        </Button>
        {myState ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={cancelFeedback}
          >
            取消反馈
          </Button>
        ) : null}
      </div>
      {message ? (
        <p className="text-sm text-[var(--color-ink-muted)]" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
