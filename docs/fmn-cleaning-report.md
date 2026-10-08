# FMN Cleaning Report v1

Analysis and maintenance assessment only.  
**No files were deleted, renamed, merged, or refactored as part of this report.**

| Field | Value |
| :--- | :--- |
| Report date | 2026-10-08 |
| Inputs | `docs/fmn-architecture-map.md`, `docs/phase3-current-state.md`, Decision Log / product / design / component library, `.cursor/rules/phase3-*.mdc` |
| Last committed HEAD | `0a23547` — `feat(fmn): complete phase 3 batch 2c` |
| Working tree note | Working tree clean. Batch 1 / 2A / 2B / 2C all committed and pushed. |

---

## 1. Current Project Health

FMN is a Travel Shopping Record & Sharing Web App on Next.js 15 + React 19 + Supabase.

```text
FMN currently contains:

Phase 1:
  Core travel shopping record (trips, items, auth, trip/item images)

Phase 2:
  Public discovery and user features (search, follows, recommendations, profiles, todos)

Phase 3:
  Companion intelligence layer (shell, Draft→Confirm, quantity/receipts foundation,
  F3-01 text write, F3-02 own-history + Destination + 最近,
  F3-03 Organize, F3-04 Todo formal + Duplicate)
```

**Overall architecture state:** layered and readable. Pages compose UI; domain logic lives in `lib/*`; Companion capabilities go through `lib/workflows/*`. Public vs private search is split by module (`lib/search` vs `lib/history`). Tests and `phase3:check` exist for Batch 1 / 2A / 2B / 2C boundaries.

**Health, not “cleanliness”:** the tree is not overgrown with parallel AI products, extra chat routes, or LLM SDKs. Main maintenance risks are (1) untracked local noise, (2) receipt DAL/schema present but unused by UI, (3) `CompanionHost` intent-router growth before F3-05, (4) L-04 / L-05 / L-06 Layer 2 still Later (OCR / STT / LLM).

---

## 2. Architecture Assessment

### Pages Layer (`app/`)

Routes are clearly owned by product surfaces:

| Route family | Ownership |
| :--- | :--- |
| `/`, `/login`, `/register` | Home + auth |
| `/trips/**` | Trip / item / todo CRUD |
| `/search` | Public discovery only |
| `/users/[userId]`, `/followers`, `/following` | Social / profile |

**Duplicated entry points:** none for Companion. Companion mounts on Home (Global) and Trip Detail (Trip) only — no `/companion` page. That is by design, not a missing route.

**Unclear responsibility:** none at folder level. `/search` must stay public discovery; own-history stays inside Companion, not a second search page.

---

### Component Layer (`components/`)

Folders map to domains (`item`, `travel`, `todo`, `search`, `user`, `companion`, plus `foundation` / `form` / `feedback`).

**Repeated UI patterns (candidates, not merge instructions):**

| Pattern | Where | Note |
| :--- | :--- | :--- |
| Record cards | `ItemCard` vs `SearchResultCard` (product variant) | Different types and contexts (see §5) |
| Trip cards | `TripCard` vs `SearchResultCard` (travel variant) | Archive vs public discovery |
| Forms | `ItemForm`, `ShoppingTodoForm`, `RecordDraftReview` | Manual pages vs Companion Confirm (see §5) |
| Empty states | `EmptyState` variants including `NoHistoryMatches` | Shared component, variant growth |

Naming is generally domain-prefixed (`ShoppingTodo*`, `Companion*`, `Search*`). No `AI*` family in application code.

---

### Workflow Layer (`lib/workflows/`)

| Workflow | Role | Write? |
| :--- | :--- | :--- |
| `record-input/` | F3-01 text → Draft helpers + `confirmShoppingRecordWrite` | Formal write via `createItem` after Explicit Confirm |
| `historical-search/` | F3-02 parse + `runOwnHistorySearch` (Destination / 最近) | Read-only; must not import item mutations |
| `organize/` | F3-03 parse + `runOrganize` | Read-only; reuses `lib/history` |
| `todo-planning/` | F3-04 text → Todo Draft + Confirm + Duplicate gate | Formal write via `createTodo` after Explicit Confirm |

**Boundaries:** write isolation is correct for current code. Host routes intent: record / history / organize / todo.

**Future expansion risks:** stuffing F3-05 into `CompanionHost` without a thin router; mixing public `lib/search` into history; treating Companion Context as ACL; inventing Brand or OCR/STT/LLM before L-04 / L-05 / L-06 Layer 2 close.

---

### Domain Layer

| Module | Purpose | Phase | Status |
| :--- | :--- | :--- | :--- |
| `lib/items` | Shopping Record types, queries, mutations | P1 (+ quantity P3) | Core; in use |
| `lib/trips` | Trip types, queries, mutations, stats, visibility, destination-parse, recent-trip, resolve-* | P1–P3 | Core; in use |
| `lib/todos` | Shopping Todo DAL, validation, legacy gate, `duplicate` | P2–P3 | Core; in use |
| `lib/search` | Public discovery queries | P2 | Core boundary; used by `/search` and public profile trips |
| `lib/history` | Own-item historical query | P3 Batch 2A / 2C | Core boundary; used by historical-search + History UI + Organize; supports Destination filter |
| `lib/companion` | Draft/Task localStorage, confirm intent, types | P3 | Core runtime |
| `lib/receipts` | Receipt DAL | P3 | **Schema + module exist; no app/workflow caller found** |
| `lib/recommendations` | Recommend / not-recommend | P2 | In use on public cards |
| `lib/follows` | Follow graph | P2 | In use |
| `lib/quantity` | Shared quantity parse | P3 | In use |
| `lib/share` | Canonical share URLs | P2 | In use (`ShareButton`, trip/item pages) |

---

## 3. Keep List

Do not “clean” these as unused or merge them away without a Product / architecture decision.

| Path | Reason |
| :--- | :--- |
| `lib/items` | Phase 1 core domain |
| `lib/trips` | Phase 1 core domain |
| `lib/todos` | Phase 2 todo domain + Phase 3 quantity / validation |
| `lib/search` | Public search boundary |
| `lib/history` | Private history boundary (intentional parallel to search) |
| `lib/companion` | Phase 3 runtime boundary |
| `lib/workflows/record-input` | Formal write path |
| `lib/workflows/historical-search` | Read-only history path |
| `lib/workflows/organize` | Read-only organize path |
| `lib/workflows/todo-planning` | Todo formal Confirm + Duplicate gate |
| `components/companion/*` | In-page Companion; not a chat product |
| `app/search/page.tsx` | Public discovery entry |
| `supabase/migrations/*` | Historical schema truth |
| `docs/phase3-current-state.md` | Only dynamic implementation baseline |
| `docs/phase3-decisions.md` / Phase 3 product & design docs | Locked product/AI rules |
| `.cursor/rules/phase3-*.mdc` | Agent constitution |
| `.cursor/archive/phase1-2/*` | Intentionally archived Phase 1–2 rules |
| `scripts/phase3-boundary-check.ts` | Boundary automation |
| Dual sanitizers `lib/search/sanitize` and `lib/history/sanitize` | Isolation, not accidental copy-paste to merge |

---

## 4. Cleanup Candidates

### Level A — Safe Cleanup

No architecture risk if removed from disk / gitignore after PO/dev confirmation. **This report does not delete them.**

| Path | Issue | Risk |
| :--- | :--- | :--- |
| `debug-09d689.log` | Untracked agent/session log | None for product |
| `npm-install.log` | Untracked install log | None |
| `supabase/snippets/` | Local SQL scratch (not a migration) | None if never applied as product schema |
| `.next/` | Build cache (should stay untracked) | Regenerable |

---

### Level B — Review Needed

Do not change without discussion. Not proven dead.

| Path | Issue | Risk |
| :--- | :--- | :--- |
| `lib/receipts/*` | DAL unused by pages/workflows; foundation for later OCR/receipt write | **High if deleted** — Batch 1 data foundation; OCR (L-04) will need it |
| `lib/storage/receipt-buckets.ts` | Constants unused by other TS callers; buckets exist in migration | High if deleted while schema remains |
| `ItemCard` vs `SearchResultCard` product variant | Similar card chrome; different types (`ItemWithDisplay` vs `PublicItemSearchResult`) | Medium if merged — can mix public discovery with owner cards |
| `TripCard` vs search travel card | Overlapping trip presentation | Medium |
| `CompanionHost.tsx` | Growing intent router (F3-01 + F3-02 + F3-03 + F3-04) | Medium — consider thin router extraction before F3-05 |
| `docs/product.md` + `docs/phase3-product.md` (and design/component pairs) | Layered docs; readers may confuse “current product” vs Phase 3 overlay | Low if both kept with clear roles |
| `public/test-assets/` | Local SVG placeholders | Low — keep unless product says otherwise |
| Verify scripts (`batch1`–`batch2c3-verify`, `architecture:scan`) | “Temporary” feel vs durable gates | Low if they remain the acceptance harness |

---

### Level C — Do Not Touch

| Path / area | Why |
| :--- | :--- |
| All `supabase/migrations/` | Irreversible history; includes RLS and storage policies |
| RLS / storage policies in those migrations | Permission and Public/Private rules |
| `lib/search` ↔ `lib/history` split | Locked public ≠ private history |
| Formal write path (`confirm-write` → `createItem`) | Draft ≠ Formal Record |
| Companion mount points (no `/companion` route) | Design + Decision Log |
| Quantity / receipt **schema** | Data integrity; even if UI unused |
| Later Decision features (L-04–L-06 inventing OCR, STT, LLM; Brand remains BLOCKED by L-01) | Product-blocked |
| Phase 3 Plan v2 | Historical plan; do not rewrite as status tracker |

---

## 5. Possible Duplication Analysis

### Item Display

| Surface | Component | Context |
| :--- | :--- | :--- |
| Trip / own archive | `ItemCard` + `ItemGrid` | Owner `ItemWithDisplay`, optional visibility |
| Public `/search` | `SearchResultCard` + `ItemCard` (search page also imports both) | Public types + recommendation counts |
| Companion F3-02 | `HistoryResultSection` → **`ItemCard`** | Own history, `showVisibility` |

**Verdict:** not true duplicates. `SearchResultCard` is a **public discovery** union (product / travel / user). `ItemCard` is the **record card** for owned/formal items. History correctly reuses `ItemCard` instead of an AI card. Overlap is visual language, not two competing history systems.

There is no separate `HistoryResult` card component — by design.

---

### Forms

| UI | Role |
| :--- | :--- |
| `ItemForm` | **Manual** create/edit/purchase-from-todo on dedicated pages |
| `ShoppingTodoForm` | **Manual** todo create/edit on dedicated pages |
| `RecordDraftReview` | **Workflow confirmation** for F3-01 Draft (not a second Item CRUD page) |

**Verdict:** different jobs. Consolidating Draft review into `ItemForm` would blur Input → Draft → Confirm → Formal Write.

---

### Search

| Module | Audience | Visibility |
| :--- | :--- | :--- |
| `lib/search` | Other people’s public trips/items (+ public profile lists) | Filters / assumes public |
| `lib/history` | Current user’s own records | `trips!inner` + `user_id`; **no** visibility filter |

**Verdict:** separation is **correct** and must stay. Duplicate `sanitize` helpers are an isolation cost, not a merge candidate.

---

## 6. Technical Debt List

| Issue | Impact | Suggested future action |
| :--- | :--- | :--- |
| I-01 batch TX not implemented | Fine for single-item Confirm; unsafe for multi-write | Implement in Batch 3 |
| I-02 receipt temp lifecycle incomplete | Temp bucket without promote/cleanup | Implement in Batch 3 |
| F3-05 Orchestration not started | F3-05 feature absent | Plan after Batch 3 |
| `CompanionHost` intent router now handles 4 workflows | Complexity will grow with F3-05 | Discuss thin router extraction; not urgent |
| Receipt DAL unused | Dead-looking code vs required foundation | Keep until F3-01 receipt path; do not delete |
| Few automated tests vs pages | Regression load on manual E2E | Keep batch verify scripts; add tests when changing domains |
| Layered product/design docs | Onboarding confusion | Clarify “Phase 1–2 inherited” vs Phase 3 overlay in onboarding, not by deleting docs |
| `next build` vs `next dev` `.next` clash | Dev runtime errors after production build | Process note; not a code cleanup |

---

## 7. Questions For Product Owner

Need human decision — **this report does not answer them.**

1. Should untracked logs (`debug-09d689.log`, `npm-install.log`) and `supabase/snippets/` be gitignored, deleted locally, or ignored forever?
3. Is unused `lib/receipts` acceptable as “foundation waiting for OCR/receipt input,” or should Product schedule a receipt UI slice soon so the DAL is not orphaned?
4. Should `ItemCard` and public `SearchResultCard` product variant stay separate indefinitely, or is a later visual-token alignment (without merging modules) desired?
5. Which historical files are **intentionally preserved**: `.cursor/archive/phase1-2`, Phase 1–2 `docs/product.md` / `design-system.md` / `component-library.md`?
6. Is `CompanionHost` complexity acceptable until F3-05, or should a routing extraction be planned before more workflows?
7. Should verify/scan scripts stay as `npx tsx` one-offs, or become a required CI job?
8. When (if ever) is it acceptable to rename modules (`historical-search` vs `history`) for naming consistency — or is stability more important?

---

## 8. Recommended Cleaning Order

### Phase A — Safe

- After explicit approval: stop tracking local logs/snippets; gitignore if they will keep regenerating.
- Do not touch application `lib/` or `components/` in this phase.

### Phase B — After discussion

- Receipt DAL: keep vs schedule wiring (not delete).
- Card/form “duplication”: confirm they remain context-separated.
- Host growth: optional later split, Product/engineering agreement.

### Phase C — Future refactor

- F3-05 orchestration as new folders, not Host dumps.
- I-01 / I-02 when multi-write and receipt lifecycle are in scope.
- L-04 / L-05 / L-06 Layer 2 only after Later Decisions close.
- Any component consolidation only after reuse evidence, following Phase 3 component-library rules (reuse first, no AI-parallel set).

---

## Report close

This is v1 of the cleaning assessment. It is not a license to delete or merge.
