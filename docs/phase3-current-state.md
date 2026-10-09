# Phase 3 Current State

Factual implementation baseline after Phase 3 Batch 1 / 2A / 2B / 2C / 3 / 4-A / 4-B / 4-C. L-01 Destination, L-03 「最近」, and L-02 Duplicate Detection are implemented and committed. Batch 3 I-01 / I-02 shared write infrastructure is implemented and committed (`c746c49`); Batch 3 docs sync (`5a081c0`) and input-boundary docs sync (`06b5b05`) applied; Batch 3 Runtime Review = **PASS**. Batch 4-A Receipt Draft Group and Batch 4-B receipt extraction boundary are committed in `6b005bb`. Batch 4-C adds a server-side Gemini adapter for OCR, STT, and `gemini-3.5-flash`, committed and pushed in `4a26cfb`. Brand remains BLOCKED. L-04 / L-05 / L-06 product decisions are **Closed**. Provider choice for this batch is Gemini. Live OCR, STT, and LLM API results, including LLM field accuracy, are **NOT VERIFIED**. `test:batch4c` injects fake responses and does not call Gemini. Batch 5 / F3-05 is not started.

This document describes **what exists in the repository now**.  
It is not a product requirements document and not an implementation plan.

---

## 1. Baseline Information

| Field | Value |
| :--- | :--- |
| Date | 2026-10-09 |
| Branch | `master` (tracking `origin/master`) |
| Batch 4-C commit | `4a26cfb` — `feat: complete batch 4 Gemini provider integration`, pushed to `origin/master`. Batch 4-A and Batch 4-B remain in `6b005bb`. |
| Prior HEAD before this docs sync | `4a26cfb` — `feat: complete batch 4 Gemini provider integration` |
| Batch 4-B docs commit | `15470c5` — `docs: lock batch 4B receipt OCR boundary` |
| Working tree note | Before this docs sync, local `master` and `origin/master` both pointed at `4a26cfb`, and the working tree was clean. Batch 4-C has been pushed. Live OCR, STT, and LLM API results, including LLM field accuracy, remain **NOT VERIFIED**. |
| Prior Batch 2C feature commit | `0a23547` — `feat(fmn): complete phase 3 batch 2c` |
| Prior Batch 2B feature commit | `5796e42` — `feat(fmn): implement phase 3 batch 2b — legacy boundary, organize, todo formal path` |
| Prior Batch 2A feature commit | `fa86bfe` — `feat(fmn): add F3-02 own-history and architecture baseline` |
| Prior docs sync commit | `5a081c0` — `docs(fmn): sync phase 3 batch 3 state` |
| Prior Batch 1 eslint commit | `4b9c928` — `chore(fmn): add eslint flat config` |
| Phase 3 batch status | **Batch 1 / 2A / 2B / 2C completed**; **Batch 3 completed and committed (`c746c49`) — Review PASS**; **Batch 4-A Receipt Draft Group implemented** (`6b005bb`); **Batch 4-B extraction boundary implemented** (`6b005bb`); **Batch 4-C Gemini OCR / STT / LLM adapter implemented** (server fetch only, not an Agent). `test:batch4c` is an injected mock and does not call Gemini. Live OCR, STT, and LLM API results, including LLM field accuracy, are **NOT VERIFIED**. |
| Verification | `npm run phase3:check` / `test:batch1` / `test:batch2a` / `test:batch2b` / `test:batch2c1` / `test:batch2c2` / `test:batch2c3` / `test:batch3` / `test:batch4a` / `test:batch4c` / `typecheck` / `lint` + local Supabase Batch 3 Runtime Review. `test:batch4a` and `test:batch4c` do not call Gemini. |

Related product / decision sources (do not treat as “implemented” unless listed below):

- `docs/phase3-decisions.md`
- `docs/phase3-design-system.md`
- `docs/phase3-component-library.md`
- `docs/phase3-product.md`
- `docs/phase3-intelligence-architecture.md`
- `.cursor/rules/phase3-project.mdc`
- `.cursor/rules/phase3-design-system.mdc`
- `.cursor/rules/phase3-component-library.mdc`

---

## 2. Completed Implementation

### Architecture Boundary Check

| Item | Path / script |
| :--- | :--- |
| Scanner | `scripts/phase3-boundary-check.ts` |
| npm script | `npm run phase3:check` |

Checks: forbidden `/companion` route, AI component family, conversation DB tables, OCR/STT/LLM deps, `lib/history` ↛ `lib/search`, historical-search read-only, required Companion / Draft / data-foundation baseline, Legacy Boundary fixed UTC constant. Exit `0` = no FAIL (WARN allowed).

---

### Batch 1 — Step 1: Data Foundation

Migration:

- `supabase/migrations/20261001180000_phase3_data_foundation.sql`

#### Quantity

- `items.quantity` — `integer not null default 1`, constraint `items_quantity_positive` (`quantity >= 1`)
- `shopping_todos.quantity` — same shape; constraint `shopping_todos_quantity_positive`
- App helpers: `lib/quantity.ts`
- Wired through item/todo types, forms, and DAL

#### Receipts

- Table `receipts`: `id`, `user_id`, `image_path`, `receipt_date`, `created_at`
- Table `receipt_items`: `(receipt_id, item_id)` PK; `receipt_items_item_id_unique` on `item_id`
- App DAL: `lib/receipts/types.ts`, `lib/receipts/mutations.ts`

#### Storage

- Buckets (stubs for I-02 lifecycle): `receipt-images-temp`, `receipt-images`
- App constants: `lib/storage/receipt-buckets.ts`
- Full temp promote / cleanup jobs are **not** implemented

#### RLS

- RLS enabled on `receipts` and `receipt_items`
- Own-row policies for select / insert / update / delete (receipt_items has no update policy)
- Storage path-prefix own policies for both receipt buckets

#### Explicitly not completed in Batch 1 Step 1

- I-01 multi-write batch transaction RPC / function skeleton is **not** present
- (Legacy Boundary UTC completed later in Batch 2B Step 0 — see below)

---

### Batch 1 — Step 2: Companion Shell + Runtime State

UI:

| Piece | Path |
| :--- | :--- |
| Host | `components/companion/CompanionHost.tsx` |
| Launcher | `components/companion/CompanionLauncher.tsx` |
| Surface | `components/companion/CompanionSurface.tsx` |
| Record Draft review | `components/companion/RecordDraftReview.tsx` |

Mount points:

- Global Entry: `app/page.tsx` (Home / My Trips)
- Trip Entry: `app/trips/[tripId]/page.tsx` (owner Trip Detail)

Runtime:

| Concern | Implementation |
| :--- | :--- |
| Surface modes | Compact (drawer) / Expanded (page-in-page) |
| Context | Global (`tripId = null`) or Trip (current trip); default write/query context only |
| Conversation | In-memory React state in `CompanionHost`; cleared on Surface close |
| Draft state | `lib/companion/draft-storage.ts` — localStorage `fmn:draft:*`, 7-day TTL |
| Task state | `lib/companion/task-storage.ts` — localStorage; stores `draftId` reference only |
| Types | `lib/companion/types.ts` |

---

### Batch 1 — Step 3: F3-01 Text Path (Draft → Confirm → Write)

| Stage | Implementation |
| :--- | :--- |
| Text input | Companion composer (rule/manual mode; not LLM) |
| Parse → Draft | `lib/workflows/record-input/text-parse.ts` |
| Draft review / edit | `components/companion/RecordDraftReview.tsx` |
| Explicit Confirm intent | `lib/companion/confirm-intent.ts` + Confirm button; non-confirm phrases do not write |
| Formal write | `lib/workflows/record-input/confirm-write.ts` → `confirmShoppingRecordWrite` → `createItem` |

Guarantees:

- Input → Draft → Review → Explicit Confirm → Formal Write
- Global Entry with Trip unset: Confirm disabled until Trip is chosen
- No guessing of Product / Price / Location when absent from input

Verification: `scripts/batch1-verify.ts` (`npm run test:batch1`)

---

### Batch 2A — F3-02 Own History Foundation

**Status:** Implemented (read-only own Shopping Record query)

#### Data access (`lib/history/`)

| File | Role |
| :--- | :--- |
| `types.ts` | `OwnHistoryQuery`; `OWN_HISTORY_LIMIT` |
| `sanitize.ts` | Local ILIKE sanitization — **does not** import `lib/search` |
| `queries.ts` | `searchOwnItems()` — `trips!inner` + `trips.user_id`; includes own private items |

#### Workflow (`lib/workflows/historical-search/`)

| File | Role |
| :--- | :--- |
| `parse-query.ts` | Deterministic intent + filter parse; Destination / relative Destination-Trip / 「最近」(recentTrip) supported |
| `run-search.ts` | Server action `runOwnHistorySearch` — auth + parse + DAL; **no** mutations |

#### Companion integration

- History path: **no Draft**, **no Confirm**, **no formal write**
- Results: `HistoryResultSection` reuses `ItemCard` + `EmptyState`

Verification: `scripts/batch2a-verify.ts` (`npm run test:batch2a`)

---

### Batch 2B — Step 0: Legacy Boundary UTC

**Status:** Implemented (Product Owner approved)

| Item | Value / path |
| :--- | :--- |
| Boundary UTC | `2026-10-02T00:00:00.000Z` |
| Runtime constant | `lib/todos/legacy-boundary.ts` → `FMN_LEGACY_TODO_BOUNDARY_UTC` / `_ISO` |
| Classifier | `classifyTodoLegacy` → `"legacy"` \| `"new"` \| `"unknown"` (invalid dates → `"unknown"`) |
| Migration (comment only) | `supabase/migrations/20261002120000_phase3_todo_legacy_boundary.sql` |
| Decision Log | `docs/phase3-decisions.md` D2-06 补充：Boundary 定义 |
| Table comment | Prior `obj_description` was NULL; comment set (no overwrite merge needed) |

Does **not**: rewrite old Todo rows, add `NOT NULL`, change RLS.

---

### Batch 2B — Step 5: F3-03 Organize

**Status:** Implemented for fields already in the data model (read-only)

#### Workflow (`lib/workflows/organize/`)

| File | Role |
| :--- | :--- |
| `types.ts` | Spec + result view (recordCount ≠ quantitySum; per-currency totals) |
| `parse-query.ts` | Deterministic parse; explicit price bounds; Destination / 「最近」(recentTrip) supported; Brand cues still unsupported |
| `compute.ts` | Pure filter/group/sort/aggregate (no DB, no mutations) |
| `run-organize.ts` | Server entry — reuses `lib/history.searchOwnItems`; no writes |

#### Companion UI

- `OrganizeResultSection` — StatGroup (Record Count / Quantity) + per-currency Stat + ItemCard groups
- `CompanionHost` routes `organize` intent → `runOrganize`

#### Supported

- Filter: category / **explicit price bounds** (`minPrice` / `maxPrice` + currency) / currency / location / purchase date / trip
  - e.g. `价格高于 3000 日元`, `价格低于 3000 日元`, `3000 日元以内`, `价格在 2000-5000 日元之间`
  - Approx (`预算` / `大概` / `左右`) does **not** become exact price bounds
- Group: category / currency / trip
- Sort: price / date / product name
- Aggregate: record count, quantity sum, **per-currency totals only** (no FX)

#### Explicitly blocked / not invented

- Brand intent via explicit `牌子` / `品牌` cues — returns unsupported (L-01 keeps Brand BLOCKED; no brand vocabulary; bare names alone are not treated as Brand)
- Cross-currency sum / FX
- Any item create/update/delete

---

### Batch 2C-1 — L-01 Destination

**Status:** Implemented and committed (`0a23547`)

#### Migration

- `supabase/migrations/20261003120000_phase3_trip_destination.sql`
- `ALTER TABLE public.trips ADD COLUMN destination text`
- No `NOT NULL`; no historical backfill

#### Trip Create / Edit / Detail

- Types / DAL: `lib/trips/types.ts`, `mutations.ts`, `detail.ts`, `queries.ts`, `stats.ts`
- Validation: `isTripDestinationFilled` / `normalizeTripDestination` in `lib/trips/validation.ts`
- `TripForm`: Destination free-text field; **required on create**; edit allows empty (`NULL`) for historical trips; no autocomplete
- `TripCover` (Trip Detail): shows Destination; empty → `未填写` (not an error state)

#### F3-02 / F3-03 Destination query

- `OwnHistoryQuery.destination` + optional `relativeDestinationTrip` (`latest` / `first`)
- DAL: `searchOwnItems` filters `trips.destination` via ILIKE `%term%` (NULL does not match)
- Parse: `lib/trips/destination-parse.ts` + updates to `historical-search/parse-query.ts` / `organize/parse-query.ts`
- Relative Destination Trip (“上次去日本” / “第一次去…”): resolve one Trip by `start_date` via `lib/trips/resolve-destination-trip.ts` (not latest item)
- Brand remains BLOCKED (explicit `牌子`/`品牌` → unsupported)

Verification: `scripts/batch2c1-verify.ts` (`npm run test:batch2c1`)

#### Explicitly not in Batch 2C-1

- Brand field / Brand inference / Brand query
- L-02 Duplicate Detection UI
- L-03 「最近」 candidate resolution
- Calendar-year auto window（去年/前年/今年 → ask for explicit date）

---

### Batch 2C-2 — L-03「最近」

**Status:** Implemented and committed (`0a23547`)

「最近」≠ 时间窗口。= 最近一次 **已开始**（`start_date` ≤ today UTC）且 **有 Shopping Record** 的 Trip。不用 `end_date`，不用 item `purchase_date` 排序。

- Pure resolve: `lib/trips/recent-trip.ts`（max 5, `start_date` DESC）
- Server: `lib/trips/resolve-recent-trip.ts`
- Parse flag: `OwnHistoryQuery.recentTrip` — F3-02 / F3-03
- Valid Trip Entry (started + has records) → use Current Trip, no picker
- Invalid / Global: 0 → `没有创建过有 record 的旅行`; 1 → use; many → `CandidateSelector` Trip variant, select = execute (no second confirm)
- UI: `components/companion/CandidateSelector.tsx`

Verification: `scripts/batch2c2-verify.ts` (`npm run test:batch2c2`)

---

### Batch 2C-3 — L-02 Duplicate Detection

**Status:** Implemented and committed (`0a23547`)

Same Trip Shopping Todo only. Exact AND match: Product + `reference_price`/`reference_currency` + `reference_location`. No auto-merge.

- Pure: `lib/todos/duplicate.ts`
- Detect before create: `confirmShoppingTodoWrite` + `ShoppingTodoForm` create
- Prompt: `TodoDuplicatePrompt` — 创建新的 / 使用已有 / 修改已有 / 合并数量（用户决定）
- Quantity merge: `mergeTodoQuantity` / `confirmMergeTodoQuantity` only after explicit user action

Verification: `scripts/batch2c3-verify.ts` (`npm run test:batch2c3`)

---

### Batch 3 — I-01 Atomic Batch Confirm + I-02 Receipt Temp Lifecycle

**Status:** Completed — Runtime Review **PASS** (no blocking issues)

#### I-01 — Atomic Batch Confirm

- Migration: `supabase/migrations/20261008120000_phase3_batch_confirm_rpc.sql`
- Postgres function: `confirm_batch_shopping_writes(p_trip_id, p_items, p_receipt)` — `SECURITY INVOKER`, `GRANT EXECUTE` to `authenticated`
- Single function body = sole multi-record Confirm TX; any `raise` → full rollback
- Ownership: `auth.uid()` trip ownership + receipt path-prefix check; RLS still applies on inserts
- Domain: `lib/batch/confirm-batch-writes.ts` → `.rpc(...)` only (no serial insert + compensate)
- Workflow: `lib/workflows/shared/confirm-batch-write.ts` — validate → optional I-02 promote → RPC → temp cleanup
- Existing single-record F3-01 `confirmShoppingRecordWrite` / `convertTodoToItem` unchanged
- No multi-record Companion UI in Batch 3. Batch 4-A later adds Receipt Draft Group review on the same I-01 path.

#### I-02 — Receipt Temporary Lifecycle

- Buckets unchanged: `receipt-images-temp` / `receipt-images` (+ existing RLS)
- TTL: `RECEIPT_TEMP_TTL_MS` = 7 days (`lib/storage/receipt-buckets.ts`)
- Lifecycle DAL: `lib/storage/receipt-lifecycle.ts` — temp upload / signed URL / delete / promote / expired cleanup
- Workflow actions: `lib/workflows/shared/receipt-temp.ts`
- Confirm path: temp → formal copy, then I-01 RPC creates `receipts` + `receipt_items` with items; temp deleted after success; best-effort formal cleanup on RPC failure
- Cancel: `CompanionHost` calls `cleanupTempReceipt(receiptImageRef)`
- Expire: Companion open calls `sweepExpiredTempReceipts()` (async, ≤7d)
- No OCR

#### Runtime Review (local Supabase)

| Check | Result |
| :--- | :--- |
| I-01 batch Confirm RPC success | PASS |
| I-01 atomic rollback (no partial items / receipts / receipt_items) | PASS |
| I-01 authorization / RLS / path ownership / EXECUTE | PASS |
| I-02 temp → formal promotion + formal receipt / receipt_items | PASS |
| I-02 RPC failure → DB rollback + formal cleanup when delete succeeds | PASS |
| I-02 cancel temp cleanup | PASS |
| I-02 7-day expiration sweep | PASS |
| Blocking issues | None |

**Residual risk (non-blocking):** Storage promote is outside the Postgres transaction. After RPC rollback, if best-effort formal Storage delete fails or is skipped, an orphan formal object may remain. DB rows stay consistent (full rollback).

Static verification: `scripts/batch3-verify.ts` (`npm run test:batch3`)

---

### Batch 4-A — Receipt Draft Group

**Status:** Implemented in `6b005bb`. This is not image OCR.

- Client model: `ReceiptDraftGroup` in `lib/companion/types.ts` (`version`, `id`, `createdAt`, `updatedAt`, `receiptImageRef`, `receiptDate`, `merchant`, `items: ShoppingRecordDraft[]`)
- Persistence: `saveReceiptDraftGroup` / `loadReceiptDraftGroup` / `clearReceiptDraftGroup` in `lib/companion/draft-storage.ts`. Storage key `fmn:draft:receipt_group:active`. One active group. Not a database table.
- One group holds multiple item drafts. The image ref stays on the group. Each item draft keeps `receiptImageRef` null.
- Helpers in `lib/workflows/record-input/receipt-draft-group.ts`: `createEmptyReceiptDraftGroup`, `addReceiptItemDraft`, `updateReceiptItemDraft`, `deleteReceiptItemDraft`. Deleting one item does not clear the group image, merchant, or the other items.
- Review: `components/companion/ReceiptDraftGroupReview.tsx` composes `RecordDraftReview` with `showWriteActions={false}`. Group-level confirm stays on the group. Manual add and per-item delete are in the review. `CompanionHost` starts the group, adds items with `createEmptyShoppingRecordDraft`, deletes items, and uploads the image with `uploadTempReceipt`.
- Explicit confirm: `CompanionHost.runReceiptGroupWrite` calls `confirmBatchShoppingWrite` once after `getReceiptDraftGroupConfirmState` is ready. Payload is the edited item drafts plus `tempReceiptPath` and `receiptDate`. Merchant is not sent. Cancel cleans the temp image once.
- `merchant` is draft-only. There is no `receipts.merchant` column in this batch.

Verification: `scripts/batch4a-verify.ts` (`npm run test:batch4a`)

What that script actually checks for 4-A:

- Pure helpers: two items on one group, edit isolation, delete keeps the image and the other item, manual add, confirm readiness false until every item is complete.
- Source text only: `ReceiptDraftGroupReview.tsx` contains `RecordDraftReview` and `ImageUploader`; `CompanionHost.tsx` contains `confirmBatchShoppingWrite`.

What it does not check:

- No browser run, no Supabase write, no temp-upload round trip, and no assertion that a receipt image becomes item drafts.

---

### Batch 4-B — Receipt Extraction Boundary

**Status:** Extraction helper implemented in `6b005bb`. Product decision L-04 is closed. This helper is not image OCR. Gemini image recognition is the Batch 4-C adapter, and its live API result is **NOT VERIFIED**.

Four separate states:

1. Product decision closed (`15470c5` locks the extraction-only rule in the product / decision / architecture docs and `phase3-project.mdc`).
2. Extraction boundary/helper implemented (`ReceiptLineExtraction`, `toReceiptLineExtraction`, `receiptDraftGroupFromStructured`).
3. This helper does not read an image. Gemini image recognition is Batch 4-C.
4. L-04a is Gemini in Batch 4-C, not a choice made inside this helper. Live API results are **NOT VERIFIED**.

Helper facts in `lib/workflows/record-input/receipt-draft-group.ts`:

- `ReceiptLineExtraction` fields: `product_name`, `receipt_line_price: number | null`, `quantity: number | null`.
- `toReceiptLineExtraction` / `extractionQuantity` keep a missing quantity null. They do not turn it into 1.
- `draftQuantityFromExtraction` applies the existing `DEFAULT_QUANTITY` (1) from `lib/quantity.ts` only when building `ShoppingRecordDraft`. An explicit quantity such as 3 is copied through.
- `itemFromExtraction` copies `receipt_line_price` onto editable `ShoppingRecordDraft.price`. It does not divide that amount by quantity.
- `receiptDraftGroupFromStructured` builds a `ReceiptDraftGroup` from already-structured lines. It does not read an image.
- The helper file does not call Supabase and does not insert, update, or delete formal rows.
- Batch 4-B itself did not call a provider. Batch 4-C now calls `toReceiptLineExtraction` from `lib/providers/gemini/ocr.ts` after a Gemini response, then `receiptDraftGroupFromStructured` from `CompanionHost`.
- `CompanionHost.handleReceiptImage` still only calls `uploadTempReceipt` / `cleanupTempReceipt`. Sending the image to Gemini is a separate opt-in action.

Verification: same `scripts/batch4a-verify.ts` (`npm run test:batch4a`). This documentation pass describes the script text. It does not record a new runtime log.

What the script actually asserts:

- Case A: helper input `product_name` KITKAT, `receipt_line_price` 900, `quantity` 3. Draft price stays 900 and draft quantity stays 3. Draft price is not 300.
- Case B: extraction `quantity` null stays null, including `extractionQuantity(undefined)`. The mapped draft quantity is 1. That 1 is the draft default, not an extraction result.
- Case C: two supplied line prices 900 and 500 stay 900 and 500. The script does not pass a receipt total. It only asserts 900 is not 1400.
- Case D: a supplied line price 1000 stays 1000 and is not 800. The script does not parse a discount line.
- Cases E, F, and G are not executed. The section title mentions tax, Tax-Free, and refund. The body has no tax, Tax-Free, or refund fixture. A source check that the helper file does not contain the word `tax` is not a receipt scenario.
- Case H: source text of the helper must not contain `supabase`, `.insert(`, `.update(`, `.delete(`, or `receipt_line_price / quantity`. This does not query the database.

---

### Batch 4-C — Gemini OCR, STT, and constrained LLM

**Status:** Server adapter implemented. Provider choice is Gemini, model `gemini-3.5-flash`. No Gemini SDK was added. Calls use server `fetch` to the official generateContent endpoint. `GEMINI_API_KEY` is read only on the server. The local diagnostic request to `127.0.0.1:7453` has been removed. Batch 4-C is committed and pushed as `4a26cfb` (`feat: complete batch 4 Gemini provider integration`). Live OCR, STT, and LLM API results, including LLM field accuracy, are **NOT VERIFIED**.

- OCR: `recognizeReceiptLines` reads an owned temp receipt only after `consent: true`, then `extractReceiptLinesFromImage`. Lines pass through `toReceiptLineExtraction`. `CompanionHost` appends them with `receiptDraftGroupFromStructured`. The review remains `ReceiptDraftGroupReview`. Confirm is still `confirmBatchShoppingWrite`.
- STT: `transcribeSpeech` accepts audio only after consent. The transcript is passed to the existing local `submitText` path. Audio is not stored.
- LLM: `structureShoppingText` sends the current text only after consent. Vague phrases and explicit confirm phrases are rejected before a draft is created. Explicit fields become a `ShoppingRecordDraft` through `shoppingRecordDraftFromLlmFields`. Missing price, currency, date, and location stay empty. Quantity uses the existing draft default of 1 only when the model did not state one.
- The plain「发送」button still uses the local rule parser and does not call Gemini.
- `phase3:check` still bans other OCR/STT/LLM packages. It does not treat this fetch adapter as a banned dependency.

Verification: `scripts/batch4c-verify.ts` (`npm run test:batch4c`) injects fake responses. It does not call Gemini.

---

### Batch 2B — Step 6: F3-04 Todo Formal Path (Companion)

**Status:** Implemented (Draft → Explicit Confirm → Write); Phase 2 manual form unchanged

#### Workflow (`lib/workflows/todo-planning/`)

| File | Role |
| :--- | :--- |
| `text-parse.ts` | Rule parse → `ShoppingTodoDraft`; budget/approx → ask (no draft write) |
| `confirm-write.ts` | `confirmShoppingTodoWrite` → `createTodo` after server re-validation |

#### Companion UI / runtime

- `ShoppingTodoDraft` in `lib/companion/types.ts`
- `TodoDraftReview` — required fields gate Confirm
- `CompanionHost` routes `todo` intent; Confirm button / explicit confirm phrases only

#### New Todo required (application layer; no DB `NOT NULL`)

- Trip, Product, `reference_price` (concrete), `reference_currency`, `reference_location` (计划购买地点)

#### Price semantics

- Concrete (e.g. `3000 日元`) → may set `reference_price`
- 预算 / 大概 / 以内 / 左右 / 上下（与数字同句且距离 ≤10 字符）→ **ask**; never invent formal price
- Unrelated `以下` / `上下` in other clauses do not block

#### Explicitly not in Batch 2B

- L-02 Duplicate Detection (deferred to Batch 2C-3; auto-merge remains forbidden)
- Public Product candidate selector (optional; not required this batch)
- Legacy Todo force-fill of New required fields

Verification: `scripts/batch2b-verify.ts` (`npm run test:batch2b`)

---

## 3. Existing Architecture Boundaries

| Boundary | Current state |
| :--- | :--- |
| No `/companion` route | No `app/companion/**`; Companion is in-page Surface only |
| No Conversation database | No `conversations` / `messages` tables |
| Conversation is in-memory | Cleared on Companion close / refresh / tab close |
| Draft ≠ Formal Record / Todo | Draft is localStorage + review UI; formal data only after Explicit Confirm |
| Context ≠ Permission | Companion Context is default write/query context; RLS / ownership remain permission boundary |
| Public search ≠ Private history | `lib/search/**` + `/search` = public; `lib/history/**` = own-history only (isolated) |
| Organize is read-only | `lib/workflows/organize` reuses history; no item mutations |
| No extra AI SDK | Batch 4-C uses a server-side Gemini `fetch` adapter for OCR, STT, and constrained LLM fields. No OCR / STT / LLM SDK package is installed. The adapter is not an Agent. Live API results are **NOT VERIFIED**. Batch 4-B remains a pure extraction helper. |
| No AI-parallel UI components | No `AIButton` / `AIInput` / `AIForm` in `*.ts` / `*.tsx` |
| No Agent loop | F3-05 orchestration not implemented |
| Formal write safety | F3-01 / F3-04 Confirm paths; Receipt Draft Group confirm uses `confirmBatchShoppingWrite` / I-01 RPC; extraction helper does not write; F3-02 / F3-03 read-only |
| Legacy / New Todo boundary | Fixed UTC `2026-10-02T00:00:00.000Z` |
| Boundary automation | `npm run phase3:check` |

---

## 4. Current Blocked Areas

Closed Later Decisions vs repository implementation:

| ID | Topic | Decision status | Implementation status |
| :--- | :--- | :--- | :--- |
| L-01 | Destination / Brand | **Closed** | **Destination implemented** (Batch 2C-1): nullable `trips.destination`, TripForm create-required, Trip Detail / `未填写`, F3-02 / F3-03 ILIKE filter + relative Destination-Trip resolve. Brand remains **BLOCKED** (no `brand` field; explicit `牌子`/`品牌` cues still unsupported). |
| L-02 | Duplicate detection equality | **Closed** | **Implemented** (Batch 2C-3): same-Trip exact AND match; prompt 发现相似 Todo; no auto-merge; Quantity merge only if user chooses. |
| L-03 | “最近” semantics | **Closed** | **Implemented** (Batch 2C-2): started + has records; `start_date` DESC; max 5; Current Trip short-circuit; no time window. |

Product decisions closed. Do not invent new closures. Batch 4-C selected Gemini; a live API call is still unverified:

L-04 / L-05 / L-06 product decisions are Closed. That is not the same as an implemented recognizer or a selected provider.

| ID | Topic | Product Decision | Implementation |
| :--- | :--- | :--- | :--- |
| L-04 | Receipt OCR business rules | ✅ Closed | Extraction helper plus Gemini OCR adapter (Batch 4-C). Live API not verified. |
| L-05 | Voice STT business rules | ✅ Closed | Gemini transcript adapter (Batch 4-C). Live API not verified. |
| L-06 | LLM business rules | ✅ Closed | `gemini-3.5-flash` structured fields (Batch 4-C). Live API not verified. |
| L-04a | OCR provider | Gemini for Batch 4-C | Server fetch adapter. Not live-verified. |
| L-05a | STT provider | Gemini for Batch 4-C | Server fetch adapter. Not live-verified. |
| L-06a | LLM provider | `gemini-3.5-flash` | Server fetch adapter. Not live-verified. |

L-04 / L-05 / L-06 product boundaries stay closed. Batch 4-C may call Gemini only after user consent, and only into Draft review.

Additional open inputs (not Later Decisions):

| Item | Current state |
| :--- | :--- |
| I-01 batch transaction RPC | **Completed** (Batch 3) + Runtime Review PASS |
| I-02 receipt temp lifecycle | **Completed** (Batch 3) + Runtime Review PASS |
| Storage vs DB TX residual risk | Known non-blocking: orphan formal Storage object possible if post-rollback cleanup fails |
| Multi-record Companion UI | Receipt Draft Group review exists (Batch 4-A). F3-05 orchestration is not implemented. |

---

## 5. Next Development Slice

1. Batch 3 / Shared Write Infrastructure — **已完成**（I-01 / I-02 Runtime Review PASS；implementation commit `c746c49`；docs sync `5a081c0` / `06b5b05`）
2. Batch 4-A / Receipt Draft Group — **已实现**（`6b005bb`）。范围限于本地草稿组、多商品草稿、编辑 / 删除 / 手动新增、以及既有 `confirmBatchShoppingWrite`。不是 OCR。
3. Batch 4-B / Receipt extraction boundary — **边界 helper 已实现**（`6b005bb`）。
4. Batch 4-C / Gemini OCR + STT + `gemini-3.5-flash` — **服务端适配已实现**。`test:batch4c` 是注入的 Mock，不调用 Gemini。真实 OCR、STT、LLM 结果及 LLM 字段准确性为 **NOT VERIFIED**。用户必须先授权。失败时仍可手动输入。不开始 Batch 5。
5. Batch 5 / F3-05 bounded orchestration — **未开始**。不得提前实现。
6. Batch 6 / Hardening only（只修 implementation correctness / security / RLS / error handling / provider failure / idempotency / draft recovery / cleanup / regression / boundary violations；**不得新增产品能力**）— 未作为本状态的下一授权实现。

不创建未经 Product Owner 批准的 Batch 7。

### Current implementation status

- Receipt Draft Group = implemented (Batch 4-A)
- Receipt extraction helper = implemented (Batch 4-B)
- Gemini OCR / STT / `gemini-3.5-flash` adapter = implemented (Batch 4-C)
- Live OCR, STT, and LLM API results, including LLM field accuracy = **NOT VERIFIED**
- Provider integration = server fetch only; no SDK package

L-04 / L-05 / L-06 product boundaries are closed. Batch 4-C selects Gemini / `gemini-3.5-flash`. That selection is not a successful live API test.

Remain forbidden:

- Brand field / Brand inference (L-01 Closed: Brand stays BLOCKED)
- Duplicate auto-merge (L-02 Closed: prompt only, never auto-merge)
- OCR / STT / LLM packages other than the server-side Gemini fetch adapter
- Putting `GEMINI_API_KEY` in a `NEXT_PUBLIC_` variable or in the client
- Treating Batch 4-B as a shipped OCR feature
- Agent loop / F3-05 early
- Converting public `lib/search` into private history

---

## 6. Rules for Future Coding

1. **Phase 3 Plan v2 is a historical implementation plan.**  
   Do not update or rewrite it to track completion.  
   Do not mark planned items as completed inside the Plan document.

2. **This document (`docs/phase3-current-state.md`) is the coding baseline for repository reality.**  
   Update **only this Current State document** when implementation status changes.

3. Continue to obey locked Phase 3 sources for product and AI boundaries:

   - `docs/phase3-decisions.md`
   - `docs/phase3-product.md`
   - `docs/phase3-intelligence-architecture.md`
   - `docs/phase3-design-system.md`
   - `docs/phase3-component-library.md`
   - `.cursor/rules/phase3-*.mdc`

4. L-04 / L-05 / L-06 Product Decisions（OCR / STT / LLM 业务规则）已 Closed。Batch 4-C 使用 Gemini / `gemini-3.5-flash`，密钥只放服务端 `GEMINI_API_KEY`。不得安装其它 OCR / STT / LLM package，不得把未校验的模型输出写成正式记录。Do not invent Brand despite L-01 Destination being implemented.

5. Prefer:

   ```text
   Agent → Workflow → Tool / Data Operation
   ```

   Formal writes remain:

   ```text
   Input → Draft → Review → Explicit Confirm → Formal Write
   ```

6. Minimum necessary change for the active coding batch only. Do not start Phase 4 or out-of-batch features early.
