"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/foundation/Button";
import { Textarea } from "@/components/foundation/Textarea";
import { CompanionLauncher } from "@/components/companion/CompanionLauncher";
import { CompanionSurface } from "@/components/companion/CompanionSurface";
import {
  RecordDraftReview,
  type TripOption,
} from "@/components/companion/RecordDraftReview";
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
  TaskState,
} from "@/lib/companion/types";
import { confirmShoppingRecordWrite } from "@/lib/workflows/record-input/confirm-write";
import {
  buildShoppingRecordDraftFromText,
  getShoppingRecordDraftMissing,
} from "@/lib/workflows/record-input/text-parse";

type ConversationMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
};

type CompanionHostProps = {
  context: CompanionContext;
  trips: TripOption[];
};

/**
 * Companion Shell + F3-01 text Confirm path.
 * Conversation is in-memory only; Draft/Task use localStorage.
 */
export function CompanionHost({ context, trips }: CompanionHostProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CompanionSurfaceMode>("compact");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState<ShoppingRecordDraft | null>(null);
  const [task, setTask] = useState<TaskState | null>(null);
  const [writing, setWriting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

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
      return;
    }
    setTask(existingTask);
    if (existingTask.draftId && existingTask.draftType) {
      const d = loadDraft(existingTask.draftType, existingTask.draftId);
      setDraft(d);
    } else {
      setDraft(null);
    }
  }, []);

  useEffect(() => {
    restorePersisted();
  }, [restorePersisted]);

  function clearConversation() {
    setMessages([]);
    setInput("");
    setWriteError(null);
  }

  function handleClose() {
    // Close Surface clears Conversation only — keep Draft / Task State.
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

  function handleSubmitText() {
    const raw = input.trim();
    if (!raw) return;
    appendMessage("user", raw);
    setInput("");

    // Natural-language confirm only when an active draft exists AND intent is explicit.
    if (draft && isExplicitConfirmIntent(raw)) {
      void runFormalWrite("intent");
      return;
    }

    // Vague affirmations / continue / ok — never write.
    if (draft) {
      appendMessage(
        "assistant",
        "如需写入正式记录，请点击「确认写入正式记录」，或明确说「帮我保存」「确认写入」。普通回复不会触发写入。",
      );
      return;
    }

    startDraftFromText(raw);
  }

  function handleCancelDraft() {
    if (task) {
      cancelTaskAndClearDraft(task);
    } else if (draft) {
      clearDraft("shopping_record", draft.id);
      clearTaskState();
    }
    setDraft(null);
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
                ? "可以描述已购买的商品。我会整理成草稿供你确认；默认使用当前旅行，你仍可查询或改选其他旅行。"
                : "可以描述已购买的商品。全局入口不会自动选择旅行；正式写入前请明确选择所属旅行。",
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

          <div className="mt-auto space-y-2 border-t border-[var(--color-line)] pt-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例如：商品名称：Anessa，价格 450 THB"
              disabled={writing}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={writing || !input.trim()}
                onClick={handleSubmitText}
              >
                发送
              </Button>
            </div>
            <p className="text-xs text-[var(--color-ink-muted)]">
              当前为规则/手动模式（L-06 未关闭，未接入 LLM）。仅「确认写入正式记录」或明确的保存指令会触发正式写入。
            </p>
          </div>
        </div>
      </CompanionSurface>
    </>
  );
}
