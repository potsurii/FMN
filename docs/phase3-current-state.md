# Phase 3 Current State

Factual implementation baseline after Phase 3 Batch 1 / 2A / 2B / 2C / 3. L-01 Destination, L-03 「最近」, and L-02 Duplicate Detection are implemented and committed. Batch 3 I-01 / I-02 shared write infrastructure is implemented; Batch 3 Runtime Review = **PASS**. Brand remains BLOCKED. L-04 / L-05 / L-06 product decisions (OCR / STT / LLM business rules) are **Closed**; implementation / provider integration is **not started**.

This document describes **what exists in the repository now**.  
It is not a product requirements document and not an implementation plan.

---

## 1. Baseline Information

| Field | Value |
| :--- | :--- |
| Date | 2026-10-08 |
| Branch | `master` (tracking `origin/master`) |
| Last committed HEAD | docs sync Batch 3 Review PASS — `docs(fmn): sync phase 3 batch 3 state` (hash in git log / commit report) |
| Prior HEAD before this docs sync | `48dcbad` — `docs(fmn): sync navigation docs after phase 3 batch 2c` |
| Working tree note | Batch 3 implementation files may remain outside this docs-only sync commit until a separate feature commit |
| Prior Batch 2C feature commit | `0a23547` — `feat(fmn): complete phase 3 batch 2c` |
| Prior Batch 2B feature commit | `5796e42` — `feat(fmn): implement phase 3 batch 2b — legacy boundary, organize, todo formal path` |
| Prior Batch 2A feature commit | `fa86bfe` — `feat(fmn): add F3-02 own-history and architecture baseline` |
| Prior docs sync commit | `bc94852` — `docs(fmn): close L-01/L-02/L-03 and sync phase 3 docs` |
| Prior Batch 1 eslint commit | `4b9c928` — `chore(fmn): add eslint flat config` |
| Phase 3 batch status | **Batch 1 / 2A / 2B / 2C completed**; **Batch 3 (I-01 / I-02) completed — Review PASS / Ready for Commit** |
| Verification | `npm run phase3:check` / `test:batch1` / `test:batch2a` / `test:batch2b` / `test:batch2c1` / `test:batch2c2` / `test:batch2c3` / `test:batch3` / `typecheck` / `lint` + local Supabase Batch 3 Runtime Review |

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
- No demo multi-record Companion UI invented; shared infrastructure ready for formal Workflows

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
| No AI provider integration | No OCR / STT / LLM packages or providers in application code |
| No AI-parallel UI components | No `AIButton` / `AIInput` / `AIForm` in `*.ts` / `*.tsx` |
| No Agent loop | F3-05 orchestration not implemented |
| Formal write safety | F3-01 / F3-04 Confirm paths; multi-record Confirm via I-01 RPC; F3-02 / F3-03 read-only |
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

Still Later (do not invent closures):

L-04 / L-05 / L-06 — Product Decisions Closed; Implementation Not Implemented.

| ID | Topic | Product Decision | Implementation |
| :--- | :--- | :--- | :--- |
| L-04 | Receipt OCR business rules | ✅ Closed | Not implemented |
| L-05 | Voice STT business rules | ✅ Closed | Not implemented |
| L-06 | LLM business rules | ✅ Closed | Not implemented |
| L-04a | OCR provider | Later (Implementation) | Not implemented |
| L-05a | STT provider | Later (Implementation) | Not implemented |
| L-06a | LLM provider | Later (Implementation) | Not implemented |

L-04 / L-05 / L-06 product boundaries are closed; implementation / provider integration is the next authorized scope.

Additional open inputs (not Later Decisions):

| Item | Current state |
| :--- | :--- |
| I-01 batch transaction RPC | **Completed** (Batch 3) + Runtime Review PASS |
| I-02 receipt temp lifecycle | **Completed** (Batch 3) + Runtime Review PASS |
| Storage vs DB TX residual risk | Known non-blocking: orphan formal Storage object possible if post-rollback cleanup fails |
| Multi-record Companion UI | Not invented in Batch 3; wire when F3-01 Receipt / F3-05 batch flows need it |

---

## 5. Next Development Slice

Suggested next coding slices (not started):

1. Batch 3 / Shared Write Infrastructure — **已完成**（I-01 / I-02 Runtime Review PASS）
2. Batch 4 / F3-01 Receipt + Voice（Provider integration；L-04 / L-05 / L-06 Product Decisions 已 Closed）
3. Batch 5 / F3-05 bounded orchestration（LLM 只能提允许的 Intent；Workflow Router 决定实际执行）
4. Batch 6 / Hardening only（只修 implementation correctness / security / RLS / error handling / provider failure / idempotency / draft recovery / cleanup / regression / boundary violations；**不得新增产品能力**）

不创建未经 Product Owner 批准的 Batch 7。

### Current implementation status

- OCR = not implemented
- STT = not implemented
- LLM = not implemented
- Provider integration = not implemented

L-04 / L-05 / L-06 product boundaries are closed; implementation / provider integration is the next authorized scope.

Remain forbidden:

- Brand field / Brand inference (L-01 Closed: Brand stays BLOCKED)
- Duplicate auto-merge (L-02 Closed: prompt only, never auto-merge)
- Provider / OCR / STT / LLM integration without authorized Batch 4 scope（product boundaries 已 Closed，但 implementation 仍未开始）
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

4. L-04 / L-05 / L-06 Product Decisions（OCR / STT / LLM 业务规则）已 Closed；Provider 选择（L-04a / L-05a / L-06a）仍属 Later / Implementation。未进入 authorized Batch 4 scope 前，不得接入 Provider、不得安装 OCR / STT / LLM package、不得创建 Provider integration。Do not invent Brand despite L-01 Destination being implemented.

5. Prefer:

   ```text
   Agent → Workflow → Tool / Data Operation
   ```

   Formal writes remain:

   ```text
   Input → Draft → Review → Explicit Confirm → Formal Write
   ```

6. Minimum necessary change for the active coding batch only. Do not start Phase 4 or out-of-batch features early.
