# FMN Architecture Guide v1

> Purpose:
> This document explains how FMN is structured and why each layer exists.
>
> This is a human understanding document, not an implementation specification.
>
> It should help future development avoid breaking architectural boundaries.

---

# 1. What is FMN?

FMN (Forget Me Not) is a travel shopping record system.

Core idea:

> Record what you bought, where you bought it, and how much you paid.

The system evolves in three layers:

```

FMN

Phase 1
Core Shopping Record

Phase 2
Public Discovery + User Features

Phase 3
Companion Intelligence Layer

```

---

# 2. Overall Architecture

FMN follows a layered architecture:

```

User

↓

App Router Pages

↓

Components

↓

Workflows

↓

Domain Libraries

↓

Supabase Data Layer

↓

Database / Storage

```

Each layer has a different responsibility.

---

# 3. Layer Responsibilities

## 3.1 app/

Responsibility:

Application entry points and routes.

Examples:

```

app/page.tsx

Home

app/trips/[tripId]/page.tsx

Trip Detail

app/search/page.tsx

Public Search

```

Rules:

- Pages organize user flows.
- Business logic should not live here.
- Pages call components and domain functions.

---

# 3.2 components/

Responsibility:

User interface components.

Examples:

```

ItemCard

TripCard

ShoppingTodoForm

CompanionSurface

```

Rules:

Components display and collect information.

Components should not directly write database data.

---

# 3.3 workflows/

Responsibility:

User intention → business process.

Introduced mainly in Phase 3.

Example:

User says:

"I bought Anessa 450 THB"

Flow:

```

Input

↓

Record Workflow

↓

Draft

↓

Confirm

↓

Write

```

Workflow decides:

- What action is intended.
- What information is missing.
- Which domain operation should run.

---

# 3.4 Domain Libraries

Location:

```

lib/

```

Each domain owns its own logic.

---

## trips

Purpose:

Travel management.

Examples:

- Create trip
- Fetch trips
- Trip statistics

---

## items

Purpose:

Shopping records.

Core entity:

```

Shopping Record

```

Contains:

- product name
- price
- currency
- location
- purchase date
- quantity

---

## todos

Purpose:

Shopping planning.

Difference:

Item:

"I bought this."

Todo:

"I want to buy this."

---

## search

Purpose:

Public discovery.

Meaning:

"What are other travelers sharing?"

Boundary:

```

Public data
+
visibility rules

```

---

## history

Purpose:

Private user history.

Meaning:

"What have I personally bought?"

Boundary:

```

Current user
+
own records

```

Important:

```

lib/search

≠

lib/history

```

They solve different problems.

---

## companion

Purpose:

Phase 3 assistant runtime.

Responsible for:

- Companion state
- Draft state
- Context
- Conversation state

It does not directly own business data.

---

# 4. Database Architecture

Main entities:

```

trips

|

items

shopping_todos

receipts

|

receipt_items

```

Relationship:

Trip contains shopping records.

Receipt is a source document.

Receipt does not replace Shopping Record.

---

# 5. Phase Architecture

## Phase 1

Goal:

Build the core record system.

Main modules:

```

trips

items

auth

storage

```

---

## Phase 2

Goal:

Make FMN a public travel shopping database.

Main modules:

```

search

follow

recommendations

todos

```

---

## Phase 3

Goal:

Add Companion.

Architecture:

```

Companion

↓

Workflow

↓

Tools

↓

FMN Data

```

Important principles:

```

Draft ≠ Record

Conversation ≠ Draft

Context ≠ Permission

Confirm ≠ Automatic Write

```

---

# 6. Important Boundaries

## Public vs Private Search

Never merge:

```

lib/search

```

and

```

lib/history

```

Reason:

Public discovery and personal history have different permissions.

---

## Draft vs Database

Never:

```

Input
↓
Database

```

Phase 3 requires:

```

Input

↓

Draft

↓

Review

↓

Explicit Confirm

↓

Database

```

---

## Context vs Permission

Example:

Trip Entry:

```

Current Trip = Bangkok

```

means:

Default context.

It does NOT mean:

User cannot search other trips.

---

# 7. Component Philosophy

FMN does not create AI-specific component families.

Forbidden:

```

AIButton

AIForm

AIItemCard

```

Reason:

AI is an interaction method.

It is not a separate product UI system.

---

# 8. Current Future Expansion

Future features should follow:

```

New Input

↓

Workflow

↓

Existing Domain

↓

Existing Data Model

```

Examples:

Receipt:

```

Receipt Photo

↓

Receipt Workflow

↓

Draft

↓

Items

```

Voice:

```

Voice

↓

Record Workflow

↓

Draft

↓

Items

```

---

# 9. Development Rules

Before coding:

1. Check Product documents.
2. Check Decision Log.
3. Check Current State.
4. Check Architecture boundaries.

Do not:

- create duplicate domains
- bypass workflows
- merge public/private data
- write directly from AI input

---

# 10. Current Understanding

FMN is not:

- a chatbot
- a travel diary
- an e-commerce platform

FMN is:

A structured travel shopping memory system with a future intelligent assistant layer.

---

End.
```

---

这个文档完成后，你以后打开 FMN，不需要重新翻几十个 md：

先看：

```
fmn-architecture-guide.md
```

知道“我是谁”。

再看：

```
phase3-current-state.md
```

知道“我现在在哪里”。

再看：

```
fmn-architecture-map.md
```

知道“东西放在哪里”。

再看：

```
cleaning-report.md
```

知道“哪里可能需要整理”。

这四个文档会成为 FMN 后续长期维护的核心。你现在做这个整理非常及时。
