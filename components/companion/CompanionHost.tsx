"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/foundation/Button";
import { Textarea } from "@/components/foundation/Textarea";
import { CompanionLauncher } from "@/components/companion/CompanionLauncher";
import { CompanionSurface } from "@/components/companion/CompanionSurface";
import { HistoryResultSection } from "@/components/companion/HistoryResultSection";
import { OrganizeResultSection } from "@/components/companion/OrganizeResultSection";
import {
  RecordDraftReview,
  type TripOption,
} from "@/components/companion/RecordDraftReview";
import { TodoDraftReview } from "@/components/companion/TodoDraftReview";
import { isExplicitConfirmIntent } from "@/lib/companion/confirm-intent";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  sweepExpiredDrafts,
} from "@/lib/companion/draft-storage";
import {
  cancelTaskAndClearDraft,
  clearTaskState,
  completeTaskAndClearDraft,
  createTaskState,
  loadTaskState,
  saveTaskState,
} from "@/lib/companion/task-storage";
import type {
  CompanionContext,
  CompanionSurfaceMode,
  ShoppingRecordDraft,
  ShoppingTodoDraft,
  TaskState,
} from "@/lib/companion/types";
import type { ItemWithDisplay } from "@/lib/items/types";
import { confirmShoppingRecordWrite } from "@/lib/workflows/record-input/confirm-write";
import {
  buildShoppingRecordDraftFromText,
  getShoppingRecordDraftMissing,
} from "@/lib/workflows/record-input/text-parse";
import { classifyCompanionIntent } from "@/lib/workflows/historical-search/parse-query";
import { runOwnHistorySearch } from "@/lib/workflows/historical-search/run-search";
import { runOrganize } from "@/lib/workflows/organize/run-organize";
import type { OrganizeResultView } from "@/lib/workflows/organize/types";
import { confirmShoppingTodoWrite } from "@/lib/workflows/todo-planning/confirm-write";
import {
  buildShoppingTodoDraftFromText,
  getShoppingTodoDraftMissing,
} from "@/lib/workflows/todo-planning/text-parse";

type ConversationMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
};

type HistoryView = {
  summary: string;
  items: ItemWithDisplay[];
  hasMore: boolean;
};

type CompanionHostProps = {
  context: CompanionContext;
  trips: TripOption[];
};

/**
 * Companion Shell + F3-01 / F3-02 / F3-03 / F3-04 Companion paths.
 * Conversation is in-memory only; Draft/Task use localStorage.
 */
export function CompanionHost({ context, trips }: CompanionHostProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CompanionSurfaceMode>("compact");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState<ShoppingRecordDraft | null>(null);
  const [todoDraft, setTodoDraft] = useState<ShoppingTodoDraft | null>(null);
  const [task, setTask] = useState<TaskState | null>(null);
  const [writing, setWriting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [historyView, setHistoryView] = useState<HistoryView | null>(null);
  const [organizeView, setOrganizeView] = useState<OrganizeResultView | null>(
    null,
  );

  const contextLabel = useMemo(() => {
    if (context.entry === "trip" && context.tripName) {
      return `当前旅行 · ${context.tripName}`;
    }
    if (context.entry === "trip") return "当前旅行";
    return "未指定（全局入口）";
  }, [context]);

  const restorePersisted = useCallback(() => {
    sweepExpiredDrafts();
    const existingTask = loadTaskState();
    if (!existingTask || existingTask.finalState !== "active") {
      setTask(null);
      setDraft(null);
      setTodoDraft(null);
      return;
    }
    setTask(existingTask);
    if (existingTask.draftId && existingTask.draftType) {
      const d = loadDraft(existingTask.draftType, existingTask.draftId);
      if (d?.draftType === "shopping_record") {
        setDraft(d);
        setTodoDraft(null);
      } else if (d?.draftType === "shopping_todo") {
        setTodoDraft(d);
        setDraft(null);
      } else {
        setDraft(null);
        setTodoDraft(null);
      }
    } else {
      setDraft(null);
      setTodoDraft(null);
    }
  }, []);

  useEffect(() => {
    restorePersisted();
  }, [restorePersisted]);

  function clearConversation() {
    setMessages([]);
    setInput("");
    setWriteError(null);
    setHistoryView(null);
    setOrganizeView(null);
  }

  function handleClose() {
    clearConversation();
    setOpen(false);
  }

  function appendMessage(role: ConversationMessage["role"], text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role,
        text,
      },
    ]);
  }

  function startDraftFromText(raw: string) {
    setHistoryView(null);
    setOrganizeView(null);
    setTodoDraft(null);
    const trip =
      context.tripId != null
        ? trips.find((t) => t.id === context.tripId) ?? null
        : null;

    const next = buildShoppingRecordDraftFromText(raw, {
      tripId: context.entry === "trip" ? context.tripId : null,
      tripLabel:
        context.entry === "trip"
          ? context.tripName ?? trip?.name ?? null
          : null,
      tripStartDate: trip?.startDate ?? null,
      tripEndDate: trip?.endDate ?? null,
    });

    saveDraft(next);
    const nextTask = createTaskState({
      goal: "F3-01 文本录入购物记录",
      context,
      draftId: next.id,
      draftType: "shopping_record",
      currentStep: "review",
    });
    saveTaskState(nextTask);
    setDraft(next);
    setTask(nextTask);
    setWriteError(null);

    appendMessage(
      "assistant",
      "已整理为待确认草稿（规则/手动辅助，非 LLM 语义理解）。请核对并补齐必填项后，点击「确认写入正式记录」。",
    );
  }

  function startTodoDraftFromText(raw: string) {
    setHistoryView(null);
    setOrganizeView(null);
    setDraft(null);
    const trip =
      context.tripId != null
        ? trips.find((t) => t.id === context.tripId) ?? null
        : null;

    const parsed = buildShoppingTodoDraftFromText(raw, {
      tripId: context.entry === "trip" ? context.tripId : null,
      tripLabel:
        context.entry === "trip"
          ? context.tripName ?? trip?.name ?? null
          : null,
    });

    if (parsed.status === "ask") {
      appendMessage("assistant", parsed.message);
      return;
    }

    const next = parsed.draft;
    saveDraft(next);
    const nextTask = createTaskState({
      goal: "F3-04 创建购物代办",
      context,
      draftId: next.id,
      draftType: "shopping_todo",
      currentStep: "review",
    });
    saveTaskState(nextTask);
    setTodoDraft(next);
    setTask(nextTask);
    setWriteError(null);

    appendMessage(
      "assistant",
      "已整理为购物代办草稿。请核对 Trip / 商品 / 具体参考价格 / 货币 / 计划购买地点后，点击「确认写入正式代办」。预算或约数不能作为正式参考价。",
    );
  }

  async function runHistorySearch(raw: string) {
    setSearching(true);
    setHistoryView(null);
    setOrganizeView(null);
    try {
      const result = await runOwnHistorySearch({
        text: raw,
        defaultTripId: context.entry === "trip" ? context.tripId : null,
      });

      if (!result.ok) {
        appendMessage(
          result.kind === "blocked" ? "system" : "assistant",
          result.error,
        );
        return;
      }

      setHistoryView({
        summary: result.summary,
        items: result.items,
        hasMore: result.hasMore,
      });
      appendMessage(
        "assistant",
        result.items.length === 0
          ? `未找到符合「${result.summary}」的记录。`
          : `已找到 ${result.items.length} 条记录（只读，非草稿）。`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "查询失败，请重试";
      appendMessage("system", msg);
    } finally {
      setSearching(false);
    }
  }

  async function runOrganizeFlow(raw: string) {
    setSearching(true);
    setOrganizeView(null);
    setHistoryView(null);
    try {
      const result = await runOrganize({
        text: raw,
        defaultTripId: context.entry === "trip" ? context.tripId : null,
      });

      if (!result.ok) {
        appendMessage(
          result.kind === "blocked" ? "system" : "assistant",
          result.error,
        );
        return;
      }

      setOrganizeView(result.view);
      appendMessage(
        "assistant",
        result.view.recordCount === 0
          ? `未整理到符合「${result.view.summary}」的记录。`
          : `已整理 ${result.view.recordCount} 条记录（只读）。记录条数与数量合计分开展示；金额按币种独立汇总。`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "整理失败，请重试";
      appendMessage("system", msg);
    } finally {
      setSearching(false);
    }
  }

  async function runFormalWrite(from: "button" | "intent") {
    if (!draft) return;
    const { complete, missing } = getShoppingRecordDraftMissing(draft);
    if (!complete) {
      setWriteError(`请先补齐：${missing.join("、")}`);
      appendMessage(
        "system",
        from === "intent"
          ? "已识别写入意图，但必填字段仍不完整，尚未写入。"
          : "必填字段不完整，无法写入。",
      );
      return;
    }

    setWriting(true);
    setWriteError(null);
    try {
      const result = await confirmShoppingRecordWrite({
        tripId: draft.tripId as string,
        name: draft.name,
        price: draft.price as number,
        currency: draft.currency as string,
        location: draft.location,
        purchaseDate: draft.purchaseDate as string,
        category: draft.category,
        note: draft.note.trim() ? draft.note.trim() : null,
        quantity: draft.quantity,
        imagePath: draft.imagePath,
        visibility: draft.visibility,
      });

      if (!result.ok) {
        setWriteError(result.error);
        appendMessage(
          "system",
          `写入失败：${result.error}。草稿已保留，可修改后重试。`,
        );
        return;
      }

      if (task) {
        completeTaskAndClearDraft(task);
      } else {
        clearDraft("shopping_record", draft.id);
        clearTaskState();
      }
      setDraft(null);
      setTask(null);
      appendMessage(
        "assistant",
        `已写入正式购物记录「${result.item.name}」。`,
      );
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "写入失败，请重试";
      setWriteError(msg);
      appendMessage("system", `写入失败：${msg}。草稿已保留。`);
    } finally {
      setWriting(false);
    }
  }

  async function runTodoFormalWrite(from: "button" | "intent") {
    if (!todoDraft) return;
    const { complete, missing } = getShoppingTodoDraftMissing(todoDraft);
    if (!complete) {
      setWriteError(`请先补齐：${missing.join("、")}`);
      appendMessage(
        "system",
        from === "intent"
          ? "已识别写入意图，但代办必填字段仍不完整，尚未写入。"
          : "代办必填字段不完整，无法写入。",
      );
      return;
    }

    setWriting(true);
    setWriteError(null);
    try {
      const result = await confirmShoppingTodoWrite({
        tripId: todoDraft.tripId as string,
        name: todoDraft.name,
        referencePrice: todoDraft.referencePrice as number,
        referenceCurrency: todoDraft.referenceCurrency as string,
        referenceLocation: todoDraft.referenceLocation,
        category: todoDraft.category,
        note: todoDraft.note.trim() ? todoDraft.note.trim() : null,
        quantity: todoDraft.quantity,
        imagePath: todoDraft.imagePath,
      });

      if (!result.ok) {
        setWriteError(result.error);
        appendMessage(
          "system",
          `写入失败：${result.error}。草稿已保留，可修改后重试。`,
        );
        return;
      }

      if (task) {
        completeTaskAndClearDraft(task);
      } else {
        clearDraft("shopping_todo", todoDraft.id);
        clearTaskState();
      }
      setTodoDraft(null);
      setTask(null);
      appendMessage(
        "assistant",
        `已写入正式购物代办「${result.todo.name}」。`,
      );
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "写入失败，请重试";
      setWriteError(msg);
      appendMessage("system", `写入失败：${msg}。草稿已保留。`);
    } finally {
      setWriting(false);
    }
  }

  function handleSubmitText() {
    const raw = input.trim();
    if (!raw) return;
    appendMessage("user", raw);
    setInput("");

    if ((draft || todoDraft) && isExplicitConfirmIntent(raw)) {
      if (draft) void runFormalWrite("intent");
      else if (todoDraft) void runTodoFormalWrite("intent");
      return;
    }

    if (draft || todoDraft) {
      appendMessage(
        "assistant",
        draft
          ? "如需写入正式记录，请点击「确认写入正式记录」，或明确说「帮我保存」「确认写入」。普通回复不会触发写入。"
          : "如需写入正式代办，请点击「确认写入正式代办」，或明确说「帮我保存」「确认写入」。普通回复不会触发写入。",
      );
      return;
    }

    const intent = classifyCompanionIntent(raw);

    if (intent === "ambiguous") {
      appendMessage(
        "assistant",
        "无法判断意图。请说明是录入记录、查询历史、整理数据，还是添加购物代办。",
      );
      return;
    }

    if (intent === "history") {
      void runHistorySearch(raw);
      return;
    }

    if (intent === "organize") {
      void runOrganizeFlow(raw);
      return;
    }

    if (intent === "todo") {
      startTodoDraftFromText(raw);
      return;
    }

    if (intent === "record") {
      startDraftFromText(raw);
      return;
    }

    appendMessage(
      "assistant",
      "请说明意图：录入（商品名称：…，价格 …）；查询（查 Anessa）；整理（按货币分别统计总花费）；代办（帮我加一个 Anessa，3000 日元，在松本清买）。",
    );
  }

  function handleCancelDraft() {
    if (task) {
      cancelTaskAndClearDraft(task);
    } else if (draft) {
      clearDraft("shopping_record", draft.id);
      clearTaskState();
    } else if (todoDraft) {
      clearDraft("shopping_todo", todoDraft.id);
      clearTaskState();
    }
    setDraft(null);
    setTodoDraft(null);
    setTask(null);
    setWriteError(null);
    appendMessage("system", "已取消当前草稿。");
  }

  function handleDraftChange(next: ShoppingRecordDraft) {
    setDraft(next);
    saveDraft(next);
    if (task) {
      saveTaskState({
        ...task,
        draftId: next.id,
        draftType: "shopping_record",
        currentStep: "review",
        finalState: "active",
      });
    }
  }

  function handleTodoDraftChange(next: ShoppingTodoDraft) {
    setTodoDraft(next);
    saveDraft(next);
    if (task) {
      saveTaskState({
        ...task,
        draftId: next.id,
        draftType: "shopping_todo",
        currentStep: "review",
        finalState: "active",
      });
    }
  }

  const busy = writing || searching;
  const hasAnyDraft = Boolean(draft || todoDraft);

  return (
    <>
      <CompanionLauncher
        entry={context.entry}
        tripName={context.tripName}
        onOpen={() => {
          restorePersisted();
          setOpen(true);
          if (messages.length === 0) {
            appendMessage(
              "assistant",
              context.entry === "trip"
                ? "可以录入购物记录、查询/整理历史，或添加购物代办。正式写入前须明确确认。"
                : "可以录入购物记录、查询/整理自己的历史，或添加购物代办。全局入口不会自动选择旅行。",
            );
          }
        }}
      />

      <CompanionSurface
        open={open}
        mode={mode}
        title="智能购物记录"
        contextLabel={contextLabel}
        onClose={handleClose}
        onToggleMode={() =>
          setMode((m) => (m === "compact" ? "expanded" : "compact"))
        }
      >
        <div className="flex h-full flex-col gap-4">
          <div className="space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-lg bg-[var(--color-accent)]/10 px-3 py-2 text-sm text-[var(--color-ink)]"
                    : "mr-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink-muted)]"
                }
              >
                {m.text}
              </div>
            ))}
          </div>

          {historyView && !hasAnyDraft ? (
            <HistoryResultSection
              summary={historyView.summary}
              items={historyView.items}
              hasMore={historyView.hasMore}
            />
          ) : null}

          {organizeView && !hasAnyDraft ? (
            <OrganizeResultSection view={organizeView} />
          ) : null}

          {draft ? (
            <RecordDraftReview
              draft={draft}
              trips={trips}
              writeError={writeError}
              writing={writing}
              onChange={handleDraftChange}
              onConfirm={() => void runFormalWrite("button")}
              onCancel={handleCancelDraft}
            />
          ) : null}

          {todoDraft ? (
            <TodoDraftReview
              draft={todoDraft}
              trips={trips}
              writeError={writeError}
              writing={writing}
              onChange={handleTodoDraftChange}
              onConfirm={() => void runTodoFormalWrite("button")}
              onCancel={handleCancelDraft}
            />
          ) : null}

          <div className="mt-auto space-y-2 border-t border-[var(--color-line)] pt-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="录入 / 查询 / 整理 / 代办…"
              disabled={busy}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={busy || !input.trim()}
                onClick={handleSubmitText}
              >
                {searching ? "处理中…" : "发送"}
              </Button>
            </div>
            <p className="text-xs text-[var(--color-ink-muted)]">
              规则/手动模式（L-06 未关闭）。查询与整理只读；仅明确确认后才会写入正式记录或代办。
            </p>
          </div>
        </div>
      </CompanionSurface>
    </>
  );
}
