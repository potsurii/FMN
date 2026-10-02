# FMN Project Guide

Human navigation for Forget Me Not (FMN).  
This is a **map**, not a product spec and not an implementation plan.

| Field | Value |
| :--- | :--- |
| Guide date | 2026-10-02 |
| Read first for status | [`docs/phase3-current-state.md`](phase3-current-state.md) |
| Read for structure | [`docs/fmn-architecture-map.md`](fmn-architecture-map.md), [`docs/fmn-architecture-guide.md`](fmn-architecture-guide.md) |
| Read for cleanup candidates | [`docs/fmn-cleaning-report.md`](fmn-cleaning-report.md) |

Do not rewrite those documents here — follow links when you need depth.

---

## 1. Current Project Status

| Item | Status |
| :--- | :--- |
| Product | Travel Shopping Record & Sharing Web App |
| Active phase | **Phase 3 — Companion** |
| Completed foundation | Phase 1 (core record), Phase 2 (public discovery / social / todo) |
| Batch 1 | **Accepted** — data foundation, Companion shell, F3-01 text Draft→Confirm→Write |
| Batch 2A | **Implemented in working tree** — F3-02 own-history foundation (read-only) |
| Last committed HEAD | `4b9c928` — `chore(fmn): add eslint flat config` |
| Branch vs remote | `master` ahead of `origin/master` by 1 (eslint commit); **Batch 2A + many docs/scripts still uncommitted** |
| Safe to continue | Read architecture + cleaning report; commit a stable checkpoint when authorized; extend Phase 3 only after understanding boundaries — do not invent L-01–L-06 closures |

**What is safe to continue after understanding**

- Follow Phase 3 current-state + Decision Log + MDC rules
- Keep public search and private history separate
- Formal writes only via Explicit Confirm workflows
- Do not start Phase 4 or blocked Later Decision features early

---

## 2. Product Evolution Map

```text
FMN
├── Phase 1 — Core travel shopping record
├── Phase 2 — Public discovery / social / todo
└── Phase 3 — Companion architecture
```

### Phase 1 — Core travel shopping record

| | |
| :--- | :--- |
| **Goal** | Own trips and shopping records with prices, locations, images |
| **Main modules** | Auth, trips, items, trip/item image storage |
| **Main folders** | `app/trips/**`, `app/login`, `app/register`, `lib/items`, `lib/trips`, `lib/storage/upload.ts`, `lib/supabase`, `components/item`, `components/travel`, `components/auth` |

### Phase 2 — Public discovery / social / todo

| | |
| :--- | :--- |
| **Goal** | Share publicly, discover others, follow, recommend, plan shopping todos |
| **Main modules** | Profiles/visibility, public search, follows, recommendations, shopping todos |
| **Main folders** | `app/search`, `app/users`, `app/followers`, `app/following`, `lib/search`, `lib/follows`, `lib/recommendations`, `lib/todos`, `components/search`, `components/user`, `components/todo` |

### Phase 3 — Companion architecture

| | |
| :--- | :--- |
| **Goal** | Intelligent interaction layer on FMN (not a separate chatbot product) |
| **Main modules** | Companion shell, Draft/Task state, F3-01 text Confirm write, F3-02 own-history, quantity, receipts foundation |
| **Main folders** | `components/companion`, `lib/companion`, `lib/workflows`, `lib/history`, `lib/receipts`, `lib/quantity.ts`, Phase 3 docs + `.cursor/rules/phase3-*.mdc` |

Inherited forever: multi-currency independent (no live FX); purchase location is text; Public/Private rules; Companion is in-page Surface (no `/companion` route).

---

## 3. Repository Mental Model

| Path | Meaning |
| :--- | :--- |
| `app/` | User entry routes (pages compose data + UI; mount Companion where allowed) |
| `components/` | UI building blocks (reuse before inventing new) |
| `lib/` | Business / domain logic (queries, mutations, types, validation) |
| `lib/workflows/` | Multi-step Companion processes (Confirm write, own-history search) |
| `supabase/` | Database schema, migrations, storage buckets, RLS |
| `docs/` | Product, design, decisions, architecture maps, **current-state** |
| `scripts/` | Verification and scan tools (not product runtime) |
| `.cursor/rules/` | Agent coding constitution for Phase 3 |

Typical flow:

```text
Page → Component → (Workflow) → Domain lib → Supabase → DB / Storage
```

---

## 4. Where Should New Code Go?

| Requirement type | Location | Example |
| :--- | :--- | :--- |
| New page / route | `app/.../page.tsx` | Trip detail, search page |
| UI component | `components/<domain>/` | `ItemCard`, `CompanionSurface` |
| Database query (read) | `lib/<domain>/queries.ts` | `fetchItemsByTripId`, `searchOwnItems` |
| Write / mutation | `lib/<domain>/mutations.ts` or Workflow Confirm entry | `createItem`, `confirmShoppingRecordWrite` |
| Multi-step assistant flow | `lib/workflows/<capability>/` + Companion UI | `record-input`, `historical-search` |
| Validation / shared parse | `lib/<domain>/validation.ts` or small `lib/*.ts` | `lib/quantity.ts`, todo validation |
| Public discovery search | `lib/search/**` + `app/search` only | Public trips/items |
| Private own-history search | `lib/history/**` + Companion history UI | F3-02 |
| Companion runtime state | `lib/companion/**` | Draft / Task localStorage |
| Schema / RLS / buckets | `supabase/migrations/` (only with Product approval) | Phase 3 data foundation |
| Verification | `scripts/` + `package.json` scripts | `phase3:check`, `test:batch1` |
| Implementation status | Update **only** `docs/phase3-current-state.md` | After a batch ships |

---

## 5. Important Architecture Boundaries

| Boundary | Rule |
| :--- | :--- |
| `lib/search` | **Public discovery only** — do not use for private history |
| `lib/history` | **Private own-history only** — do not import `lib/search` |
| Draft ≠ Formal Record | Draft is local review state; formal data only after Explicit Confirm |
| Conversation ≠ Draft | Conversation is in-memory and cleared on Companion close; Draft/Task persist separately |
| Context ≠ Permission | Companion Global/Trip context is default hint only; RLS/ownership is ACL |
| Receipt ≠ Shopping Record | Receipt links to items; deleting receipt join rows must not invent shopping facts |
| Workflow ≠ Agent | Workflows execute bounded capabilities; Agent (F3-05) is not implemented and must not bypass Workflow |
| Component reuse | Prefer existing cards/forms; no `AIButton` / `AIInput` / parallel AI UI family |
| No `/companion` route | Companion is in-page Surface on Home + Trip Detail |
| No invented Later Decisions | Brand / Destination / 「最近」 / OCR / STT / LLM stay blocked until L-01–L-06 close |

Automation: `npm run phase3:check`.

---

## 6. Current Known Technical Debt

From [`docs/fmn-cleaning-report.md`](fmn-cleaning-report.md) only. **No deletion decisions here.**

### Keep (architectural / foundation)

- `lib/search` ↔ `lib/history` split
- `ItemCard` vs `SearchResultCard` (different contexts)
- `ItemForm` / `ShoppingTodoForm` vs `RecordDraftReview` (manual page vs Confirm)
- `lib/receipts` + receipt buckets (foundation; unused by UI yet — do not delete as “dead”)
- Migrations, RLS, Phase 3 docs/MDC, verify scripts

### Future (known gaps, not cleanup)

- Legacy Boundary UTC unset (`FMN_LEGACY_TODO_BOUNDARY_UTC`)
- I-01 batch transaction mechanism not implemented
- I-02 receipt temp promote/cleanup incomplete
- `CompanionHost` will grow with more workflows — discuss later, not urgent delete
- L-01 / L-03 / L-04–L-06 product blocks

### Candidate cleanup (safe noise only — needs human approval)

- `debug-09d689.log`, `npm-install.log`
- `supabase/snippets/` local scratch
- Git HEAD vs working-tree drift until Batch 2A / docs checkpoint is committed

---

## 7. Development Workflow

### Before coding

1. Read `docs/phase3-current-state.md` (what exists now)
2. Read `docs/fmn-architecture-map.md` / architecture guide (where things live)
3. Read relevant product / decisions / design / component docs + `.cursor/rules/phase3-*.mdc`

### During coding

1. Implement the **smallest** valid slice for the current batch
2. Respect Workflow → Domain → DB; no Direct Formal Write from AI
3. Run `npm run phase3:check`
4. Run relevant tests (`test:batch1`, `test:batch2a`) plus `lint` / `typecheck` as needed

### After coding

1. Update **only** `docs/phase3-current-state.md` for implementation reality
2. Re-run verification (`phase3:check`, tests, `build` when appropriate)
3. Commit when authorized (do not rewrite Phase 3 Plan v2 as a status board)

---

## 8. Current Next Step

**Recommended next action (navigation, not an implementation plan):**

1. Review architecture (`fmn-architecture-map.md` / `fmn-architecture-guide.md`)
2. Review cleaning report (`fmn-cleaning-report.md`)
3. Commit a **stable checkpoint** when Product authorizes (Batch 2A + docs/scripts as appropriate)
4. Continue Phase 3 Batch 2 work **only after** understanding search/history, Draft/Confirm, and Later Decision blocks

Do not use this section as a feature backlog or coding task list.
