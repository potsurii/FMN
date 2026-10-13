/**
 * Batch 5 — whitelisted tool proposals.
 * Handlers may read or build in-memory Drafts. They do not confirm or write.
 */

import { CATEGORY_OPTIONS, isCategorySlug, type CategorySlug } from "@/lib/category";
import {
  createEmptyShoppingTodoDraft,
  type CompanionEntry,
  type ShoppingRecordDraft,
  type ShoppingTodoDraft,
} from "@/lib/companion/types";
import type { ItemWithDisplay } from "@/lib/items/types";
import { parseQuantity } from "@/lib/quantity";
import { shoppingRecordDraftFromLlmFields } from "@/lib/workflows/record-input/llm-draft";
import { runOwnHistorySearch } from "@/lib/workflows/historical-search/run-search";
import { runOrganize } from "@/lib/workflows/organize/run-organize";
import type { OrganizeResultView } from "@/lib/workflows/organize/types";
import { listOwnTripChoices } from "@/lib/workflows/orchestration/trip-choices";
import { resolveRecentTripForCurrentUser } from "@/lib/workflows/orchestration/resolve-recent-trip-action";

export type ToolContext = {
  entry: CompanionEntry;
  tripId: string | null;
  tripLabel: string | null;
  sourceText: string;
};

export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: unknown, ctx: ToolContext) => Promise<ToolResult>;
};

const CATEGORY_ENUM = CATEGORY_OPTIONS.map((option) => option.value);

const CATEGORY_SCHEMA = {
  type: "string",
  enum: CATEGORY_ENUM,
  description: "分类 slug。仅当用户明确说出分类时填写，不要根据商品名推断。",
};

function objectArgs(
  args: unknown,
  allowed: readonly string[],
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  if (args == null) return { ok: true, value: {} };
  if (typeof args !== "object" || Array.isArray(args)) {
    return { ok: false, error: "参数必须是对象。" };
  }
  const record = args as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) return { ok: false, error: "参数不符合工具定义。" };
  }
  return { ok: true, value: record };
}

function optionalString(
  record: Record<string, unknown>,
  key: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (!(key in record) || record[key] == null) return { ok: true, value: null };
  if (typeof record[key] !== "string") {
    return { ok: false, error: `${key} 必须是字符串。` };
  }
  const trimmed = (record[key] as string).trim();
  return { ok: true, value: trimmed ? trimmed : null };
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const read = optionalString(record, key);
  if (!read.ok) return read;
  if (!read.value) return { ok: false, error: `缺少 ${key}。` };
  return { ok: true, value: read.value };
}

function optionalAmount(
  record: Record<string, unknown>,
  key: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (!(key in record) || record[key] == null) return { ok: true, value: null };
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { ok: false, error: `${key} 必须是明确的非负数字。` };
  }
  return { ok: true, value };
}

function optionalCurrency(
  record: Record<string, unknown>,
  key: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const read = optionalString(record, key);
  if (!read.ok || !read.value) return read;
  if (!/^[A-Za-z]{3}$/.test(read.value)) {
    return { ok: false, error: `${key} 必须是三位字母货币代码。` };
  }
  return { ok: true, value: read.value.toUpperCase() };
}

function optionalQuantity(
  record: Record<string, unknown>,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (!("quantity" in record) || record.quantity == null) return { ok: true, value: null };
  const parsed = parseQuantity(record.quantity);
  if (parsed === null) {
    return { ok: false, error: "quantity 必须是大于等于 1 的整数。" };
  }
  return { ok: true, value: parsed };
}

function optionalDate(
  record: Record<string, unknown>,
  key: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const read = optionalString(record, key);
  if (!read.ok || !read.value) return read;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(read.value)) {
    return { ok: false, error: `${key} 必须是 YYYY-MM-DD。` };
  }
  const [year, month, day] = read.value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { ok: false, error: `${key} 不是有效日期。` };
  }
  return { ok: true, value: read.value };
}

function optionalCategory(
  record: Record<string, unknown>,
): { ok: true; value: CategorySlug | null } | { ok: false; error: string } {
  const read = optionalString(record, "category");
  if (!read.ok) return read;
  if (!read.value) return { ok: true, value: null };
  if (!isCategorySlug(read.value)) {
    return { ok: false, error: "category 不在允许的分类内。" };
  }
  return { ok: true, value: read.value };
}

function optionalTripId(
  record: Record<string, unknown>,
): { ok: true; value: string | null } | { ok: false; error: string } {
  return optionalString(record, "selected_trip_id");
}

function compactHistoryItem(item: ItemWithDisplay) {
  return {
    name: item.name,
    price: item.price,
    currency: item.currency,
    location: item.location,
    purchaseDate: item.purchaseDate,
    category: item.category,
    quantity: item.quantity,
  };
}

function compactOrganize(view: OrganizeResultView) {
  return {
    summary: view.summary,
    recordCount: view.recordCount,
    quantitySum: view.quantitySum,
    totalsByCurrency: view.totalsByCurrency,
    hasMore: view.hasMore,
    groups:
      view.groups?.map((group) => ({
        key: group.key,
        label: group.label,
        recordCount: group.recordCount,
        quantitySum: group.quantitySum,
        totalsByCurrency: group.totalsByCurrency,
      })) ?? null,
  };
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    name: "search_own_history",
    description:
      "查询当前用户自己的购物历史。text 使用用户原话，不要补充用户没说的商品、价格或地点。",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "用户的历史查询原话。" },
        selected_trip_id: {
          type: "string",
          description: "用户已经点选的旅行 id。没有点选时不要填写。",
        },
      },
      required: ["text"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const parsed = objectArgs(args, ["text", "selected_trip_id"]);
      if (!parsed.ok) return parsed;
      const text = requiredString(parsed.value, "text");
      if (!text.ok) return text;
      const selected = optionalTripId(parsed.value);
      if (!selected.ok) return selected;
      const result = await runOwnHistorySearch({
        text: text.value,
        defaultTripId: ctx.tripId,
        entry: ctx.entry,
        selectedTripId: selected.value,
      });
      if (!result.ok) {
        if (result.kind === "choose_trip") {
          return {
            ok: true,
            data: {
              status: "choose_trip",
              message: result.error,
              candidates: result.candidates,
            },
          };
        }
        if (result.kind === "ask" || result.kind === "blocked") {
          return { ok: true, data: { status: result.kind, message: result.error } };
        }
        return { ok: false, error: result.error };
      }
      return {
        ok: true,
        data: {
          status: "ok",
          summary: result.summary,
          hasMore: result.hasMore,
          items: result.items.map(compactHistoryItem),
        },
      };
    },
  },
  {
    name: "organize_records",
    description:
      "整理当前用户自己的购物记录并返回汇总。text 使用用户原话，不要补充用户没说的筛选条件。",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "用户的整理请求原话。" },
        selected_trip_id: {
          type: "string",
          description: "用户已经点选的旅行 id。没有点选时不要填写。",
        },
      },
      required: ["text"],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const parsed = objectArgs(args, ["text", "selected_trip_id"]);
      if (!parsed.ok) return parsed;
      const text = requiredString(parsed.value, "text");
      if (!text.ok) return text;
      const selected = optionalTripId(parsed.value);
      if (!selected.ok) return selected;
      const result = await runOrganize({
        text: text.value,
        defaultTripId: ctx.tripId,
        entry: ctx.entry,
        selectedTripId: selected.value,
      });
      if (!result.ok) {
        if (result.kind === "choose_trip") {
          return {
            ok: true,
            data: {
              status: "choose_trip",
              message: result.error,
              candidates: result.candidates,
            },
          };
        }
        if (result.kind === "ask" || result.kind === "blocked") {
          return { ok: true, data: { status: result.kind, message: result.error } };
        }
        return { ok: false, error: result.error };
      }
      return { ok: true, data: { status: "ok", view: compactOrganize(result.view) } };
    },
  },
  {
    name: "create_record_draft",
    description:
      "根据用户明确说出的字段生成购物记录草稿。不要猜测缺失字段，不要写入数据库。旅行使用当前上下文。",
    parameters: {
      type: "object",
      properties: {
        product_name: { type: "string", description: "用户明确说出的商品名称。" },
        price: { type: "number", description: "用户明确说出的金额。不要分摊或反推单价。" },
        currency: { type: "string", description: "三位字母货币代码，仅当用户明确说出。" },
        quantity: { type: "integer", description: "大于等于 1 的整数，仅当用户明确说出。" },
        purchase_date: { type: "string", description: "YYYY-MM-DD，仅当用户明确说出。" },
        location: { type: "string", description: "实际购买地点，仅当用户明确说出。" },
        category: CATEGORY_SCHEMA,
        note: { type: "string", description: "用户明确说出的备注。" },
      },
      required: [],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const parsed = objectArgs(args, [
        "product_name",
        "price",
        "currency",
        "quantity",
        "purchase_date",
        "location",
        "category",
        "note",
      ]);
      if (!parsed.ok) return parsed;
      const productName = optionalString(parsed.value, "product_name");
      if (!productName.ok) return productName;
      const price = optionalAmount(parsed.value, "price");
      if (!price.ok) return price;
      const currency = optionalCurrency(parsed.value, "currency");
      if (!currency.ok) return currency;
      const quantity = optionalQuantity(parsed.value);
      if (!quantity.ok) return quantity;
      const purchaseDate = optionalDate(parsed.value, "purchase_date");
      if (!purchaseDate.ok) return purchaseDate;
      const location = optionalString(parsed.value, "location");
      if (!location.ok) return location;
      const category = optionalCategory(parsed.value);
      if (!category.ok) return category;
      const note = optionalString(parsed.value, "note");
      if (!note.ok) return note;
      const hasFact = Boolean(
        productName.value ||
          price.value !== null ||
          currency.value ||
          quantity.value !== null ||
          purchaseDate.value ||
          location.value ||
          category.value ||
          note.value,
      );
      if (!hasFact) return { ok: false, error: "没有明确写出的购物字段，无法生成记录草稿。" };
      const draft: ShoppingRecordDraft = {
        ...shoppingRecordDraftFromLlmFields(
          {
            product_name: productName.value,
            price: price.value,
            currency: currency.value,
            quantity: quantity.value,
            purchase_date: purchaseDate.value,
            location: location.value,
          },
          {
            sourceText: ctx.sourceText,
            tripId: ctx.tripId,
            tripLabel: ctx.tripLabel,
          },
        ),
        category: category.value,
        note: note.value ?? "",
      };
      return { ok: true, data: { draftType: "shopping_record", draft } };
    },
  },
  {
    name: "create_todo_draft",
    description:
      "根据用户明确说出的字段生成购物代办草稿。不要猜测缺失字段，不要写入数据库。旅行使用当前上下文。",
    parameters: {
      type: "object",
      properties: {
        product_name: { type: "string", description: "用户明确说出的商品名称。" },
        reference_price: {
          type: "number",
          description: "用户明确说出的参考价格。不要把预算、区间或大约金额填进来。",
        },
        reference_currency: { type: "string", description: "三位字母货币代码，仅当用户明确说出。" },
        reference_location: { type: "string", description: "计划购买地点，仅当用户明确说出。" },
        quantity: { type: "integer", description: "大于等于 1 的整数，仅当用户明确说出。" },
        category: CATEGORY_SCHEMA,
        note: { type: "string", description: "用户明确说出的备注。" },
      },
      required: [],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const parsed = objectArgs(args, [
        "product_name",
        "reference_price",
        "reference_currency",
        "reference_location",
        "quantity",
        "category",
        "note",
      ]);
      if (!parsed.ok) return parsed;
      const productName = optionalString(parsed.value, "product_name");
      if (!productName.ok) return productName;
      const referencePrice = optionalAmount(parsed.value, "reference_price");
      if (!referencePrice.ok) return referencePrice;
      const referenceCurrency = optionalCurrency(parsed.value, "reference_currency");
      if (!referenceCurrency.ok) return referenceCurrency;
      const referenceLocation = optionalString(parsed.value, "reference_location");
      if (!referenceLocation.ok) return referenceLocation;
      const quantity = optionalQuantity(parsed.value);
      if (!quantity.ok) return quantity;
      const category = optionalCategory(parsed.value);
      if (!category.ok) return category;
      const note = optionalString(parsed.value, "note");
      if (!note.ok) return note;
      const hasFact = Boolean(
        productName.value ||
          referencePrice.value !== null ||
          referenceCurrency.value ||
          referenceLocation.value ||
          quantity.value !== null ||
          category.value ||
          note.value,
      );
      if (!hasFact) return { ok: false, error: "没有明确写出的代办字段，无法生成代办草稿。" };
      const draft: ShoppingTodoDraft = {
        ...createEmptyShoppingTodoDraft({
          sourceText: ctx.sourceText,
          tripId: ctx.tripId,
          tripLabel: ctx.tripLabel,
        }),
        name: productName.value ?? "",
        referencePrice: referencePrice.value,
        referenceCurrency: referenceCurrency.value,
        referenceLocation: referenceLocation.value ?? "",
        category: category.value,
        note: note.value ?? "",
        ...(quantity.value !== null ? { quantity: quantity.value } : {}),
      };
      return { ok: true, data: { draftType: "shopping_todo", draft } };
    },
  },
  {
    name: "list_trips",
    description: "列出当前用户自己的旅行（id 与名称）。不会自动选中任何一次旅行。",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    handler: async (args) => {
      const parsed = objectArgs(args, []);
      if (!parsed.ok) return parsed;
      const trips = await listOwnTripChoices();
      return { ok: true, data: { trips } };
    },
  },
  {
    name: "resolve_recent_trip",
    description:
      "按现有「最近」规则解析当前用户最近一次已有购物记录的旅行。不会创建旅行，也不会写入购物数据。",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const parsed = objectArgs(args, []);
      if (!parsed.ok) return parsed;
      const resolved = await resolveRecentTripForCurrentUser({
        entry: ctx.entry,
        currentTripId: ctx.tripId,
      });
      if (!resolved.ok) return resolved;
      return { ok: true, data: resolved.resolution };
    },
  },
  {
    name: "request_trip_pick",
    description:
      "用户说'这次/这趟'但系统不知道指哪次旅行时调用，让用户从候选中选择。已有 ctx.tripId 时不要调用。",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    handler: async (args, ctx) => {
      const parsed = objectArgs(args, []);
      if (!parsed.ok) return parsed;
      if (ctx.tripId) {
        return { ok: true, data: { status: "have_trip", tripId: ctx.tripId } };
      }
      const candidates = await listOwnTripChoices();
      if (candidates.length === 0) {
        return { ok: true, data: { status: "no_trip" } };
      }
      return { ok: true, data: { status: "pick_trip", candidates } };
    },
  },
];

function geminiSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(geminiSchema);
  if (!value || typeof value !== "object") return value;
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === "additionalProperties") continue;
    next[key] = geminiSchema(child);
  }
  return next;
}

export function getGeminiTools(): {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
} {
  return {
    functionDeclarations: TOOL_REGISTRY.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: geminiSchema(tool.parameters) as Record<string, unknown>,
    })),
  };
}

// CHECKPOINT 1 DONE
