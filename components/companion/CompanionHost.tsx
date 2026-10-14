"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/foundation/Textarea";
import { FmnButton } from "@/components/ui/fmn-button";
import { FmnPaperCard } from "@/components/ui/fmn-paper-card";
import { FmnTag } from "@/components/ui/fmn-tag";
import { CompanionLauncher } from "@/components/companion/CompanionLauncher";
import { CompanionSurface } from "@/components/companion/CompanionSurface";
import { HistoryResultSection } from "@/components/companion/HistoryResultSection";
import { OrganizeResultSection } from "@/components/companion/OrganizeResultSection";
import { CandidateSelector } from "@/components/companion/CandidateSelector";
import {
  RecordDraftReview,
  type TripOption,
} from "@/components/companion/RecordDraftReview";
import { ReceiptDraftGroupReview } from "@/components/companion/ReceiptDraftGroupReview";
import { TodoDraftReview } from "@/components/companion/TodoDraftReview";
import { TodoDuplicatePrompt } from "@/components/companion/TodoDuplicatePrompt";
import {
  clearDraft,
  clearReceiptDraftGroup,
  loadDraft,
  loadReceiptDraftGroup,
  saveDraft,
  saveReceiptDraftGroup,
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
import {
  createEmptyShoppingRecordDraft,
  type CompanionContext,
  type CompanionSurfaceMode,
  type ReceiptDraftGroup,
  type ShoppingRecordDraft,
  type ShoppingTodoDraft,
  type TaskState,
} from "@/lib/companion/types";
import type { ItemWithDisplay } from "@/lib/items/types";
import type { ShoppingTodoWithDisplay } from "@/lib/todos/types";
import { confirmShoppingRecordWrite } from "@/lib/workflows/record-input/confirm-write";
import {
  recognizeReceiptLines,
  structureShoppingText,
  transcribeSpeech,
} from "@/lib/workflows/record-input/gemini-actions";
import { shoppingRecordDraftFromLlmFields } from "@/lib/workflows/record-input/llm-draft";
import {
  addReceiptItemDraft,
  createEmptyReceiptDraftGroup,
  deleteReceiptItemDraft,
  getReceiptDraftGroupConfirmState,
  receiptDraftGroupFromStructured,
} from "@/lib/workflows/record-input/receipt-draft-group";
import {
  buildShoppingRecordDraftFromText,
  getShoppingRecordDraftMissing,
} from "@/lib/workflows/record-input/text-parse";
import {
  activeWorkCancelEffect,
  NOTHING_TO_CANCEL_MESSAGE,
  routeCompanionText,
  UNSUPPORTED_CROSS_WORKFLOW_MESSAGE,
} from "@/lib/workflows/historical-search/parse-query";
import { runOwnHistorySearch } from "@/lib/workflows/historical-search/run-search";
import { runOrganize } from "@/lib/workflows/organize/run-organize";
import {
  advanceAgentTask,
  agentAllowsTodoConfirm,
  cancelSurface,
  japanTodoFromHistoryResult,
  shouldCommitAgentResult,
  TRIP_PICK_PROMPT,
} from "@/lib/workflows/orchestration/control";
import { completeExplicitDestination } from "@/lib/workflows/orchestration/destination-complete";
import type { AgentContext } from "@/lib/workflows/orchestration/loop";
import { listOwnTripChoices } from "@/lib/workflows/orchestration/trip-choices";
import type { OrganizeResultView } from "@/lib/workflows/organize/types";
import {
  cleanupTempReceipt,
  sweepExpiredTempReceipts,
  uploadTempReceipt,
} from "@/lib/workflows/shared/receipt-temp";
import { confirmBatchShoppingWrite } from "@/lib/workflows/shared/confirm-batch-write";
import type { RecentTripCandidate } from "@/lib/trips/recent-trip";
import { confirmShoppingTodoWrite, confirmMergeTodoQuantity } from "@/lib/workflows/todo-planning/confirm-write";
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
  const [receiptGroup, setReceiptGroup] = useState<ReceiptDraftGroup | null>(
    null,
  );
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [providerBusy, setProviderBusy] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const agentEpochRef = useRef(0);
  const agentLoopCtxRef = useRef<AgentContext | null>(null);
  const [todoDraft, setTodoDraft] = useState<ShoppingTodoDraft | null>(null);
  const [task, setTask] = useState<TaskState | null>(null);
  const [writing, setWriting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [historyView, setHistoryView] = useState<HistoryView | null>(null);
  const [organizeView, setOrganizeView] = useState<OrganizeResultView | null>(
    null,
  );
  const [recentPick, setRecentPick] = useState<{
    flow: "history" | "organize";
    text: string;
    candidates: RecentTripCandidate[];
    confirmedTrip?: boolean;
  } | null>(null);
  const [todoDuplicates, setTodoDuplicates] = useState<
    ShoppingTodoWithDisplay[] | null
  >(null);

  const contextLabel = useMemo(() => {
    if (context.entry === "trip" && context.tripName) {
      return `当前旅行 · ${context.tripName}`;
    }
    if (context.entry === "trip") return "当前旅行";
    return "未指定（全局入口）";
  }, [context]);

  const restorePersisted = useCallback(() => {
    sweepExpiredDrafts();
    void sweepExpiredTempReceipts();
    setReceiptGroup(loadReceiptDraftGroup());
    const existingTask = loadTaskState();
    if (!existingTask || existingTask.finalState !== "active") {
      setTask(null);
      setDraft(null);
      setTodoDraft(null);
      return;
    }
    setTask(existingTask);
    if (existingTask.pendingQuestions[0]) {
      setMessages([
        {
          id: `restore_${existingTask.id}`,
          role: "assistant",
          text: existingTask.pendingQuestions[0],
        },
      ]);
    }
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
    setRecentPick(null);
    setTodoDuplicates(null);
  }

  function handleClose() {
    invalidateAgentWork();
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
    setRecentPick(null);
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
    setRecentPick(null);
    setDraft(null);
    setTodoDuplicates(null);
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

  async function runHistorySearch(
    raw: string,
    selectedTripId?: string | null,
  ) {
    setSearching(true);
    setHistoryView(null);
    setOrganizeView(null);
    if (!selectedTripId) setRecentPick(null);
    try {
      const result = await runOwnHistorySearch({
        text: raw,
        defaultTripId: context.entry === "trip" ? context.tripId : null,
        entry: context.entry,
        selectedTripId: selectedTripId ?? null,
      });

      if (!result.ok) {
        if (result.kind === "choose_trip") {
          setRecentPick({
            flow: "history",
            text: raw,
            candidates: result.candidates,
          });
          appendMessage("assistant", result.error);
          return;
        }
        appendMessage(
          result.kind === "blocked" ? "system" : "assistant",
          result.error,
        );
        return;
      }

      setRecentPick(null);
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

  async function runOrganizeFlow(
    raw: string,
    selectedTripId?: string | null,
    extra?: { confirmedTripId?: string | null; forcedDestination?: string | null },
  ) {
    const requestEpoch = agentEpochRef.current;
    setSearching(true);
    setOrganizeView(null);
    setHistoryView(null);
    if (!selectedTripId && !extra?.confirmedTripId) setRecentPick(null);
    try {
      const result = await runOrganize({
        text: raw,
        defaultTripId: context.entry === "trip" ? context.tripId : null,
        entry: context.entry,
        selectedTripId: selectedTripId ?? null,
        confirmedTripId: extra?.confirmedTripId ?? null,
        forcedDestination: extra?.forcedDestination ?? null,
      });
      if (!shouldCommitAgentResult(requestEpoch, agentEpochRef.current)) return;

      if (!result.ok) {
        if (result.kind === "choose_trip") {
          setRecentPick({
            flow: "organize",
            text: raw,
            candidates: result.candidates,
          });
          appendMessage("assistant", result.error);
          return;
        }
        appendMessage(
          result.kind === "blocked" ? "system" : "assistant",
          result.error,
        );
        if (extra?.confirmedTripId || extra?.forcedDestination) {
          clearTaskState();
          setTask(null);
        }
        return;
      }

      setRecentPick(null);
      if (extra?.confirmedTripId || extra?.forcedDestination) {
        clearTaskState();
        setTask(null);
      }
      setOrganizeView(result.view);
      appendMessage(
        "assistant",
        result.view.recordCount === 0
          ? `未整理到符合「${result.view.summary}」的记录。`
          : `已整理 ${result.view.recordCount} 条记录（只读）。记录条数与数量合计分开展示；金额按币种独立汇总。`,
      );
    } catch (err) {
      if (!shouldCommitAgentResult(requestEpoch, agentEpochRef.current)) return;
      const msg = err instanceof Error ? err.message : "整理失败，请重试";
      appendMessage("system", msg);
    } finally {
      if (shouldCommitAgentResult(requestEpoch, agentEpochRef.current)) {
        setSearching(false);
      }
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

  function persistReceiptGroup(next: ReceiptDraftGroup) {
    setReceiptGroup(next);
    saveReceiptDraftGroup(next);
  }

  function startReceiptGroup() {
    if (draft || todoDraft || receiptGroup) return;
    const next = createEmptyReceiptDraftGroup();
    persistReceiptGroup(next);
    setWriteError(null);
    appendMessage(
      "assistant",
      "已开始收据草稿。可上传临时收据图片，并手动新增商品草稿。确认前不会写入正式记录。",
    );
  }

  function handleAddReceiptItem() {
    if (!receiptGroup) return;
    const trip =
      context.tripId != null
        ? trips.find((t) => t.id === context.tripId) ?? null
        : null;
    const item = createEmptyShoppingRecordDraft({
      sourceText: "",
      tripId: context.entry === "trip" ? context.tripId : null,
      tripLabel:
        context.entry === "trip"
          ? context.tripName ?? trip?.name ?? null
          : null,
      purchaseDateDefault: receiptGroup.receiptDate,
    });
    persistReceiptGroup(addReceiptItemDraft(receiptGroup, item));
  }

  function handleDeleteReceiptItem(itemId: string) {
    if (!receiptGroup) return;
    persistReceiptGroup(deleteReceiptItemDraft(receiptGroup, itemId));
  }

  async function handleReceiptImage(file: File | null) {
    if (!receiptGroup) return;
    if (!file) {
      const prev = receiptGroup.receiptImageRef;
      persistReceiptGroup({
        ...receiptGroup,
        receiptImageRef: null,
        updatedAt: new Date().toISOString(),
      });
      if (prev) void cleanupTempReceipt(prev);
      return;
    }

    setUploadingReceipt(true);
    setWriteError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const result = await uploadTempReceipt(body);
      if (!result.ok) {
        setWriteError(result.error);
        appendMessage("system", result.error);
        return;
      }
      const prev = receiptGroup.receiptImageRef;
      persistReceiptGroup({
        ...receiptGroup,
        receiptImageRef: result.path,
        updatedAt: new Date().toISOString(),
      });
      if (prev && prev !== result.path) void cleanupTempReceipt(prev);
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function runReceiptGroupWrite(from: "button" | "intent") {
    if (!receiptGroup) return;
    const state = getReceiptDraftGroupConfirmState(receiptGroup);
    if (!state.ready) {
      setWriteError(`请先补齐：${state.reasons.join("；")}`);
      appendMessage(
        "system",
        from === "intent"
          ? "已识别写入意图，但收据草稿仍不完整，尚未写入。"
          : "收据草稿不完整，无法写入。",
      );
      return;
    }

    const tripId = receiptGroup.items[0]?.tripId;
    if (!tripId) return;

    setWriting(true);
    setWriteError(null);
    try {
      const result = await confirmBatchShoppingWrite({
        tripId,
        items: receiptGroup.items.map((item) => ({
          name: item.name,
          price: item.price as number,
          currency: item.currency as string,
          location: item.location,
          purchaseDate: item.purchaseDate as string,
          category: item.category,
          note: item.note.trim() ? item.note.trim() : null,
          quantity: item.quantity,
          imagePath: item.imagePath,
          visibility: item.visibility,
        })),
        tempReceiptPath: receiptGroup.receiptImageRef,
        receiptDate: receiptGroup.receiptDate,
      });

      if (!result.ok) {
        setWriteError(result.error);
        appendMessage(
          "system",
          `写入失败：${result.error}。草稿已保留，可修改后重试。`,
        );
        return;
      }

      clearReceiptDraftGroup();
      setReceiptGroup(null);
      appendMessage(
        "assistant",
        `已写入 ${result.result.itemIds.length} 条正式购物记录。`,
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

  function handleCancelReceiptGroup() {
    const tempReceiptPath = receiptGroup?.receiptImageRef ?? null;
    clearReceiptDraftGroup();
    setReceiptGroup(null);
    setWriteError(null);
    if (tempReceiptPath) void cleanupTempReceipt(tempReceiptPath);
    appendMessage("system", "已取消收据草稿。");
  }

  async function runTodoFormalWrite(
    from: "button" | "intent",
    duplicateAck?: "create_new",
  ) {
    if (!todoDraft) return;
    if (!agentAllowsTodoConfirm(task, todoDraft.tripId)) {
      setWriteError("请选择所属旅行后再确认写入");
      appendMessage("system", "目标旅行尚未指定，尚未写入。");
      return;
    }
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
        duplicateAck,
      });

      if (!result.ok && "kind" in result && result.kind === "duplicate") {
        setTodoDuplicates(result.existing);
        appendMessage("assistant", "发现相似 Todo。请选择如何处理，系统不会自动合并。");
        return;
      }

      if (!result.ok) {
        setWriteError(result.error);
        appendMessage(
          "system",
          `写入失败：${result.error}。草稿已保留，可修改后重试。`,
        );
        return;
      }

      finishTodoWrite(result.todo.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "写入失败，请重试";
      setWriteError(msg);
      appendMessage("system", `写入失败：${msg}。草稿已保留。`);
    } finally {
      setWriting(false);
    }
  }

  function finishTodoWrite(name: string) {
    if (!todoDraft) return;
    if (task) {
      completeTaskAndClearDraft(task);
    } else {
      clearDraft("shopping_todo", todoDraft.id);
      clearTaskState();
    }
    setTodoDraft(null);
    setTodoDuplicates(null);
    setTask(null);
    appendMessage("assistant", `已写入正式购物代办「${name}」。`);
    router.refresh();
  }

  async function handleMergeDuplicateQuantity(existing: ShoppingTodoWithDisplay) {
    if (!todoDraft) return;
    setWriting(true);
    setWriteError(null);
    try {
      const result = await confirmMergeTodoQuantity({
        tripId: existing.tripId,
        todoId: existing.id,
        addQuantity: todoDraft.quantity,
      });
      if (!result.ok) {
        setWriteError(result.error);
        appendMessage("system", `合并数量失败：${result.error}`);
        return;
      }
      finishTodoWrite(`${result.todo.name}（已合并数量）`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "合并数量失败";
      setWriteError(msg);
    } finally {
      setWriting(false);
    }
  }

  function currentTripOptions() {
    const trip =
      context.tripId != null
        ? trips.find((t) => t.id === context.tripId) ?? null
        : null;
    return {
      tripId: context.entry === "trip" ? context.tripId : null,
      tripLabel:
        context.entry === "trip"
          ? context.tripName ?? trip?.name ?? null
          : null,
    };
  }

  async function handleRecognizeReceipt() {
    if (!receiptGroup?.receiptImageRef) return;
    setProviderBusy(true);
    setWriteError(null);
    try {
      const result = await recognizeReceiptLines({
        tempPath: receiptGroup.receiptImageRef,
        consent: true,
      });
      if (!result.ok) {
        setWriteError(result.error);
        appendMessage("system", `${result.error} 收据草稿仍保留。`);
        return;
      }
      const trip = currentTripOptions();
      let next = receiptGroup;
      for (const line of result.value) {
        const built = receiptDraftGroupFromStructured(
          { items: [line] },
          trip,
        );
        const item = built.items[0];
        if (item) next = addReceiptItemDraft(next, item);
      }
      persistReceiptGroup(next);
      appendMessage(
        "assistant",
        `已加入 ${result.value.length} 条待确认商品草稿。请核对价格和数量后再确认写入。`,
      );
    } finally {
      setProviderBusy(false);
    }
  }

  async function handleStructureWithGemini() {
    const raw = input.trim();
    if (!raw || draft || todoDraft || receiptGroup) return;
    setProviderBusy(true);
    setWriteError(null);
    try {
      const result = await structureShoppingText({ text: raw, consent: true });
      if (!result.ok) {
        setWriteError(result.error);
        appendMessage("system", result.error);
        return;
      }
      const trip = currentTripOptions();
      const next = shoppingRecordDraftFromLlmFields(result.value, {
        sourceText: raw,
        tripId: trip.tripId,
        tripLabel: trip.tripLabel,
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
      setInput("");
      appendMessage("user", raw);
      appendMessage(
        "assistant",
        "已整理为待确认草稿。缺失项仍为空，请核对后点击「确认写入正式记录」。",
      );
    } finally {
      setProviderBusy(false);
    }
  }

  async function handleTranscribe() {
    if (!pendingAudio) return;
    setProviderBusy(true);
    setWriteError(null);
    try {
      const body = new FormData();
      body.set("consent", "true");
      body.set("audio", pendingAudio, "speech.webm");
      const result = await transcribeSpeech(body);
      setPendingAudio(null);
      if (!result.ok) {
        setWriteError(result.error);
        appendMessage("system", result.error);
        return;
      }
      submitText(result.value);
    } finally {
      setProviderBusy(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      appendMessage("system", "当前浏览器不能录音。可以改用手动输入。");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        setPendingAudio(blob.size > 0 ? blob : null);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      appendMessage("system", "无法使用麦克风。可以改用手动输入。");
    }
  }

  function submitText(raw: string) {
    const text = raw.trim();
    if (!text) return;
    appendMessage("user", text);
    setInput("");

    const route = routeCompanionText(text, {
      draft: Boolean(draft),
      todo: Boolean(todoDraft),
      receipt: Boolean(receiptGroup),
    });

    if (route === "cancel") {
      invalidateAgentWork();
      const hasActiveWork = Boolean(task || draft || todoDraft || receiptGroup);
      if (activeWorkCancelEffect(hasActiveWork) === "no-active-work") {
        appendMessage("assistant", NOTHING_TO_CANCEL_MESSAGE);
        return;
      }
      clearCancelledSurface();
      appendMessage("system", "已取消当前草稿。");
      return;
    }

    if (route === "confirm") {
      if (draft) void runFormalWrite("intent");
      else if (todoDraft) void runTodoFormalWrite("intent");
      else if (receiptGroup) void runReceiptGroupWrite("intent");
      return;
    }

    if (route === "keep-draft") {
      appendMessage(
        "assistant",
        draft
          ? "如需写入正式记录，请点击「确认写入正式记录」，或明确说「帮我保存」「确认写入」。普通回复不会触发写入。"
          : receiptGroup
            ? "如需写入正式记录，请点击「确认写入正式记录」，或明确说「帮我保存」「确认写入」。普通回复不会触发写入。"
            : "如需写入正式代办，请点击「确认写入正式代办」，或明确说「帮我保存」「确认写入」。普通回复不会触发写入。",
      );
      return;
    }

    const epoch = agentEpochRef.current;
    void (async () => {
      const handled = await runAgentTurn(text, epoch);
      if (agentEpochRef.current !== epoch) return;
      if (!handled) dispatchPlainIntent(route, text);
    })();
  }

  function dispatchPlainIntent(
    intent: ReturnType<typeof routeCompanionText>,
    text: string,
  ) {
    if (intent === "unsupported") {
      appendMessage("assistant", UNSUPPORTED_CROSS_WORKFLOW_MESSAGE);
      return;
    }

    if (intent === "ambiguous") {
      appendMessage(
        "assistant",
        "无法判断意图。请说明是录入记录、查询历史、整理数据，还是添加购物代办。",
      );
      return;
    }

    if (intent === "history") {
      void runHistorySearch(text);
      return;
    }

    if (intent === "organize") {
      void runOrganizeFlow(text);
      return;
    }

    if (intent === "todo") {
      startTodoDraftFromText(text);
      return;
    }

    if (intent === "record") {
      startDraftFromText(text);
      return;
    }

    appendMessage(
      "assistant",
      "请说明意图：录入（商品名称：…，价格 …）；查询（查 Anessa）；整理（按货币分别统计总花费）；代办（帮我加一个 Anessa，3000 日元，在松本清买）。",
    );
  }

  async function runAgentTurn(text: string, epoch: number): Promise<boolean> {
    const ctx: AgentContext = {
      entry: context.entry,
      tripId: context.entry === "trip" ? context.tripId : null,
      tripLabel: context.tripName,
      sourceText: text,
      cancelled: false,
    };
    agentLoopCtxRef.current = ctx;
    const step = await advanceAgentTask({
      text,
      entry: context.entry,
      currentTripId: context.entry === "trip" ? context.tripId : null,
      task,
      suggestDestination: completeExplicitDestination,
      listTripChoices: listOwnTripChoices,
      ctx,
    });
    if (agentEpochRef.current !== epoch) return true;
    if (step.kind === "passthrough") return false;
    if (step.kind === "stopped") return true;

    if (step.kind === "ask") {
      saveTaskState(step.task);
      setTask(step.task);
      appendMessage("assistant", step.text);
      return true;
    }

    if (step.kind === "choose-trip") {
      saveTaskState(step.task);
      setTask(step.task);
      appendMessage("assistant", TRIP_PICK_PROMPT);
      const candidates = step.candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        startDate: "",
      }));
      if (step.source === "history") {
        setRecentPick({
          flow: "history",
          text: step.text,
          candidates,
        });
      } else {
        setRecentPick({
          flow: "organize",
          text: step.text,
          confirmedTrip: true,
          candidates,
        });
      }
      return true;
    }

    if (step.kind === "message") {
      appendMessage("assistant", step.text);
      clearTaskState();
      setTask(null);
      return true;
    }

    if (step.kind === "history") {
      await runHistorySearch(step.text);
      if (agentEpochRef.current !== epoch) return true;
      clearTaskState();
      setTask(null);
      return true;
    }

    if (step.kind === "organize") {
      await runOrganizeFlow(step.text, null, {
        confirmedTripId: step.confirmedTripId,
        forcedDestination: step.forcedDestination,
      });
      if (agentEpochRef.current !== epoch) return true;
      clearTaskState();
      setTask(null);
      return true;
    }

    if (step.kind === "history-then-todo") {
      const result = await runOwnHistorySearch({
        text: step.historyText,
        defaultTripId: null,
        entry: "global",
      });
      if (!shouldCommitAgentResult(epoch, agentEpochRef.current)) return true;
      const applied = japanTodoFromHistoryResult(
        step.task,
        result.ok
          ? {
              ok: true,
              items: result.items.map((item) => ({
                name: item.name,
                category: item.category,
              })),
            }
          : { ok: false, error: result.error },
      );
      if (applied.kind === "todo-draft") {
        saveDraft(applied.draft);
        saveTaskState(applied.task);
        setDraft(null);
        setTodoDraft(applied.draft);
        setTask(applied.task);
        appendMessage("assistant", applied.text);
        return true;
      }
      if (applied.kind === "ask") {
        saveTaskState(applied.task);
        setTask(applied.task);
        appendMessage("assistant", applied.text);
        return true;
      }
      if (applied.kind === "message") {
        appendMessage("assistant", applied.text);
        clearTaskState();
        setTask(null);
        return true;
      }
      return true;
    }

    if (step.kind === "todo-draft") {
      saveDraft(step.draft);
      saveTaskState(step.task);
      setDraft(null);
      setTodoDraft(step.draft);
      setTask(step.task);
      appendMessage("assistant", step.text);
      return true;
    }

    if (step.kind === "loop-text") {
      saveTaskState(step.task);
      setTask(step.task);
      appendMessage("assistant", step.text);
      return true;
    }

    if (step.kind === "loop-tool-draft") {
      saveDraft(step.draft);
      saveTaskState(step.task);
      setTask(step.task);
      if (step.draft.draftType === "shopping_todo") {
        setDraft(null);
        setTodoDraft(step.draft);
      } else {
        setTodoDraft(null);
        setDraft(step.draft);
      }
      appendMessage("assistant", step.text);
      return true;
    }

    return false;
  }

  function clearCancelledSurface() {
    const tempReceiptPath =
      draft?.receiptImageRef ?? receiptGroup?.receiptImageRef ?? null;
    if (task) {
      cancelTaskAndClearDraft(task);
    } else if (draft) {
      clearDraft("shopping_record", draft.id);
      clearTaskState();
    } else if (todoDraft) {
      clearDraft("shopping_todo", todoDraft.id);
      clearTaskState();
    }
    if (receiptGroup) clearReceiptDraftGroup();
    if (tempReceiptPath) void cleanupTempReceipt(tempReceiptPath);
    setDraft(null);
    setTodoDraft(null);
    setReceiptGroup(null);
    setTask(null);
    setRecentPick(null);
    setSearching(false);
    setWriteError(null);
    setTodoDuplicates(null);
  }

  function handleSubmitText() {
    submitText(input);
  }

  function invalidateAgentWork() {
    if (agentLoopCtxRef.current) agentLoopCtxRef.current.cancelled = true;
    const next = cancelSurface(agentEpochRef.current);
    agentEpochRef.current = next.epoch;
    setRecentPick(next.recentPick);
  }

  function handleCancelDraft() {
    invalidateAgentWork();
    clearCancelledSurface();
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

  const busy = writing || searching || uploadingReceipt || providerBusy;
  const hasAnyDraft = Boolean(draft || todoDraft || receiptGroup);

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

          {recentPick && !hasAnyDraft ? (
            <CandidateSelector
              variant="trip"
              title="选择旅行"
              description={
                recentPick.confirmedTrip
                  ? "请点选这次要整理的旅行。点选之后才会排序。"
                  : "选择后将直接查询，无需再次确认。"
              }
              candidates={recentPick.candidates.map((c) => ({
                id: c.id,
                title: c.name,
                meta: c.startDate,
              }))}
              disabled={searching}
              onSelect={(id) => {
                const pending = recentPick;
                setRecentPick(null);
                if (pending.confirmedTrip) {
                  void runOrganizeFlow(pending.text, null, { confirmedTripId: id });
                } else if (pending.flow === "history") {
                  void runHistorySearch(pending.text, id);
                } else {
                  void runOrganizeFlow(pending.text, id);
                }
              }}
            />
          ) : null}

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

          {receiptGroup ? (
            <ReceiptDraftGroupReview
              group={receiptGroup}
              trips={trips}
              writeError={writeError}
              writing={writing}
              uploadingImage={uploadingReceipt}
              onChange={persistReceiptGroup}
              onAddItem={handleAddReceiptItem}
              onDeleteItem={handleDeleteReceiptItem}
              onImageFile={(file) => void handleReceiptImage(file)}
              onExtractLines={() => void handleRecognizeReceipt()}
              extracting={providerBusy}
              onConfirm={() => void runReceiptGroupWrite("button")}
              onCancel={handleCancelReceiptGroup}
            />
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
            <>
              {todoDuplicates ? (
                <TodoDuplicatePrompt
                  existing={todoDuplicates}
                  draftQuantity={todoDraft.quantity}
                  busy={writing}
                  onCreateNew={() => {
                    setTodoDuplicates(null);
                    void runTodoFormalWrite("button", "create_new");
                  }}
                  onUseExisting={(todo) => {
                    if (task) completeTaskAndClearDraft(task);
                    else {
                      clearDraft("shopping_todo", todoDraft.id);
                      clearTaskState();
                    }
                    setTodoDraft(null);
                    setTodoDuplicates(null);
                    setTask(null);
                    appendMessage(
                      "assistant",
                      `已使用已有代办「${todo.name}」，未创建新代办。`,
                    );
                  }}
                  onEditExisting={(todo) => {
                    if (task) completeTaskAndClearDraft(task);
                    else {
                      clearDraft("shopping_todo", todoDraft.id);
                      clearTaskState();
                    }
                    setTodoDraft(null);
                    setTodoDuplicates(null);
                    setTask(null);
                    router.push(`/trips/${todo.tripId}/todos/${todo.id}/edit`);
                  }}
                  onMergeQuantity={(todo) => {
                    void handleMergeDuplicateQuantity(todo);
                  }}
                  onCancel={() => {
                    setTodoDuplicates(null);
                    appendMessage("assistant", "已取消重复处理，草稿仍保留。");
                  }}
                />
              ) : (
                <TodoDraftReview
                  draft={todoDraft}
                  trips={trips}
                  writeError={writeError}
                  writing={writing}
                  onChange={handleTodoDraftChange}
                  onConfirm={() => void runTodoFormalWrite("button")}
                  onCancel={handleCancelDraft}
                />
              )}
            </>
          ) : null}

          <div className="mt-auto space-y-3 border-t border-dashed border-ink/30 pt-3 font-mono">
            <FmnPaperCard dashed className="p-3">
              <FmnTag>TEXT</FmnTag>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="录入 / 查询 / 整理 / 代办…"
                disabled={busy}
                rows={3}
                className="mt-2 !rounded-none !border-0 !border-b !border-dashed !border-ink/50 !bg-transparent !font-mono !text-sm tracking-[0.06em]"
              />
            </FmnPaperCard>
            {!draft && !todoDraft && !receiptGroup ? (
              <FmnPaperCard dashed className="space-y-3 p-3">
                <FmnTag>TIDY</FmnTag>
                <p className="font-mono text-[0.68rem] leading-relaxed tracking-wide text-ink/70">
                  授权后将发送给 Gemini：当前输入框里的文字。不发送历史记录或完整购物记录。整理结果进入待确认草稿，不会直接保存。
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <FmnButton
                    type="button"
                    variant="ticket"
                    disabled={busy || !input.trim()}
                    onClick={() => void handleStructureWithGemini()}
                  >
                    {providerBusy ? "TIDYING" : "TIDY"}
                  </FmnButton>
                </div>
                <FmnTag>VOICE</FmnTag>
                <p className="font-mono text-[0.68rem] leading-relaxed tracking-wide text-ink/70">
                  授权后将发送给 Gemini：一段语音，只用于转写。原始语音不会保存。转写文字随后走现有手动发送流程。
                </p>
                <FmnTag>UPLOAD</FmnTag>
                <input
                  type="file"
                  accept="audio/webm,audio/wav,audio/mp4,audio/mpeg"
                  disabled={busy}
                  className="font-mono text-[0.68rem] tracking-[0.08em] text-ink"
                  onChange={(event) => {
                    setPendingAudio(event.target.files?.[0] ?? null);
                  }}
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <FmnButton
                    type="button"
                    variant="ticket"
                    disabled={busy}
                    onClick={() => void toggleRecording()}
                  >
                    {recording ? "STOP" : "RECORD"}
                  </FmnButton>
                  <FmnButton
                    type="button"
                    variant="ticket"
                    disabled={busy || !pendingAudio}
                    onClick={() => void handleTranscribe()}
                  >
                    TRANSCRIBE
                  </FmnButton>
                </div>
              </FmnPaperCard>
            ) : null}
            <div className="flex justify-end gap-2">
              {!draft && !todoDraft && !receiptGroup ? (
                <FmnButton
                  type="button"
                  variant="ticket"
                  disabled={busy}
                  onClick={startReceiptGroup}
                >
                  RECEIPT
                </FmnButton>
              ) : null}
              <FmnButton
                type="button"
                variant="ticket"
                disabled={busy || !input.trim()}
                onClick={handleSubmitText}
              >
                {searching ? "SENDING" : "SEND"}
              </FmnButton>
            </div>
            <p className="font-mono text-[0.68rem] leading-relaxed tracking-wide text-ink/65">
              「发送」默认走本地规则。只有当前这句话里的目的地识别失败时，才会把这一句发给 Gemini 补全，并且只采用原句里已经写出的地名。查询与整理只读；仅明确确认后才会写入正式记录或代办。
            </p>
          </div>
        </div>
      </CompanionSurface>
    </>
  );
}
