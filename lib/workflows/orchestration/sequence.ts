/**
 * Batch 5 slice 3 — one two-step handoff.
 * Last Japan sunscreen history → one Todo Draft.
 * Does not confirm or write.
 */

import {
  createEmptyShoppingTodoDraft,
  type ShoppingTodoDraft,
  type TaskState,
} from "@/lib/companion/types";

export type SunscreenHistoryRow = {
  name: string;
  category: string | null;
};

export function userAskedToCompareCurrentTrip(text: string): boolean {
  return /还没买|已经买过|当前旅行/.test(text);
}

export function sunscreenTodoFromRows(input: {
  sourceText: string;
  rows: SunscreenHistoryRow[];
  compareCurrentTripPurchases: boolean;
}): { draft: ShoppingTodoDraft } | { draft: null } {
  if (input.compareCurrentTripPurchases) {
    return { draft: null };
  }
  const hit = input.rows.find(
    (row) => row.name.includes("防晒") || row.category === "beauty",
  );
  if (!hit || !hit.name.trim()) return { draft: null };
  const draft = createEmptyShoppingTodoDraft({
    sourceText: input.sourceText,
    tripId: null,
    tripLabel: null,
  });
  draft.name = hit.name.trim();
  if (hit.category === "beauty") draft.category = "beauty";
  return { draft };
}

export function continueJapanSunscreenTask(
  task: TaskState,
  rows: SunscreenHistoryRow[],
):
  | { kind: "draft"; task: TaskState; draft: ShoppingTodoDraft; message: string }
  | { kind: "empty"; task: TaskState; message: string }
  | { kind: "compare-asked"; task: TaskState; message: string } {
  const source = String(task.intermediateResults.originalText ?? task.goal);
  if (userAskedToCompareCurrentTrip(source)) {
    return {
      kind: "compare-asked",
      task: {
        ...task,
        currentStep: "wait",
        pendingQuestions: [
          "如果要排除当前旅行已经买过的商品，请单独说明。这一步不会自动比较。",
        ],
        completedSteps: Array.from(new Set([...task.completedSteps, "history"])),
      },
      message: "如果要排除当前旅行已经买过的商品，请单独说明。这一步不会自动比较。",
    };
  }

  const formed = sunscreenTodoFromRows({
    sourceText: source,
    rows,
    compareCurrentTripPurchases: false,
  });
  const withHistory = Array.from(new Set([...task.completedSteps, "history"]));
  if (!formed.draft) {
    return {
      kind: "empty",
      task: {
        ...task,
        currentStep: "done",
        pendingQuestions: [],
        completedSteps: withHistory,
        intermediateResults: {
          ...task.intermediateResults,
          historyRows: rows,
        },
      },
      message: "上次日本旅行里没有找到防晒记录，没有创建代办草稿。",
    };
  }
  const completed = Array.from(new Set([...withHistory, "todo-draft"]));

  return {
    kind: "draft",
    draft: formed.draft,
    task: {
      ...task,
      currentStep: "review",
      pendingQuestions: [],
      completedSteps: completed,
      draftId: formed.draft.id,
      draftType: "shopping_todo",
      intermediateResults: {
        ...task.intermediateResults,
        historyRows: rows.map((row) => ({
          name: row.name,
          category: row.category,
        })),
        trip: "unresolved",
      },
    },
    message:
      "已根据上次日本旅行的防晒记录形成购物代办草稿。目标旅行尚未指定，确认前不会写入。",
  };
}
