# Forget Me Not — Phase 3 Component Library

**Status:** Phase 3 Component Definition — Complete
**Version:** 1
**Parent Product:** Forget Me Not
**Current Phase:** Phase 3 — FMN Companion
**Base Component Library:** `docs/component-library.md`
**Related Design System:** `docs/phase3-design-system.md`
**Related Product Definition:** `docs/phase3-product.md`
**Related Intelligence Architecture:** `docs/phase3-intelligence-architecture.md`
**Related Decision Log:** `docs/phase3-decisions.md`

---

## Change Log

```text
v1 (2026-10-01)
  - Cleanup: v1.0 + Override 合并为单一 SoT
  - ShoppingTodoCard: ReferencePrice / ReferenceLocation / SourceInfo
      → reference_price / reference_currency / reference_location
  - ShoppingTodoButton: 直接加入 → 必须走 Formal Requirements
  - PurchaseConversion: ReferencePrice / ReferenceLocation / Source
      → reference_price / reference_currency / reference_location
  - 新增 Companion Components 章节（Phase 3）
```

---

# 1. Purpose

本 Component Library 定义：

> **Phase 3 FMN Companion 所需的新组件、业务组件、任务组件以及与既有组件的组合关系。**

它不重新定义：

* Product Requirements
* Agent Architecture
* Workflow Business Rules
* Global Visual Language

分别由：

```text
Product
→ docs/phase3-product.md

Intelligence Architecture
→ docs/phase3-intelligence-architecture.md

Global Design
→ docs/design-system.md

Phase 3 Design
→ docs/phase3-design-system.md
```

定义。

---

# 2. Phase 3 Component Principle

Phase 3 遵循：

> **Reuse Before Create**

优先：

```text
Existing Component
↓
Compose
↓
Variant
↓
New Component
```

不要因为 Companion 出现，就重新创建一套：

```text
AIButton
AICard
AIInput
AIAvatar
AIToast
```

---

# 3. Component Architecture

Phase 3 使用：

```text
Foundation
    ↓
Composite
    ↓
Business Component
    ↓
Page Module
    ↓
Page
```

Components become more product-specific as they move downward.

---

# 4. Existing Component Reuse

Phase 3 优先复用：

```text
Button
Input
Modal
ConfirmDialog
Toast

ItemCard
TripCard
TripCover
TravelStamp
Price
Location
CategoryTag

SearchResultCard
SearchResultGroup
RecommendationFeedback

ShoppingTodoCard
ShoppingTodoList

VisibilityBadge
```

不要创建：

```text
AIButton
AIInput
AIItemCard
AITripCard
AIConfirmDialog
```

除非存在真正独立的新职责。

---

# 5. Phase 3 Component Areas

Phase 3 新增组件主要集中于：

```text
Companion Surface
Conversation
Input
Processing
Results
Draft
Confirmation
Candidate Selection
Task Progress
Companion Modules
```

---

# 6. Phase 3 Component Tree

```text
Phase 3 Companion Components

├── 01 Companion Surface
│   ├── CompanionLauncher
│   ├── CompanionSurface
│   ├── CompanionHeader
│   └── ContextChip
│
├── 02 Conversation
│   ├── ConversationMessage
│   ├── UserMessage
│   ├── AssistantMessage
│   └── AssistantActionGroup
│
├── 03 Input
│   ├── InputComposer
│   ├── VoiceInput
│   ├── ReceiptInput
│   └── SendButton
│
├── 04 Processing
│   ├── ProcessingIndicator
│   ├── TaskStatus
│   └── TaskProgress
│
├── 05 Result
│   ├── ResultSection
│   ├── RecordResult
│   ├── SearchResult
│   ├── OrganizeResult
│   └── ResultActionGroup
│
├── 06 Draft
│   ├── DraftCard
│   ├── DraftField
│   ├── RecordDraft
│   ├── TodoDraft
│   └── BatchDraft
│
├── 07 Confirmation
│   ├── ConfirmationCard
│   ├── ConfirmationActionGroup
│   └── MissingFieldPrompt
│
├── 08 Candidate
│   ├── CandidateSelector
│   ├── CandidateCard
│   └── CandidateGroup
│
├── 09 Task
│   ├── TaskSummary
│   ├── TaskStep
│   ├── TaskStepList
│   └── TaskCompletion
│
└── 10 Companion Modules
    ├── RecordInputModule
    ├── SearchModule
    ├── OrganizeModule
    ├── TodoModule
    └── OrchestrationModule
```

---

# 7. P0 Components

Phase 3 P0：

```text
CompanionLauncher
CompanionSurface
CompanionHeader
ContextChip

ConversationMessage
UserMessage
AssistantMessage

InputComposer
VoiceInput
ReceiptInput
SendButton

ProcessingIndicator
TaskStatus
TaskProgress

ResultSection

DraftCard
RecordDraft
TodoDraft
BatchDraft
DraftField

ConfirmationCard
ConfirmationActionGroup
MissingFieldPrompt

CandidateSelector
CandidateCard

TaskSummary
TaskStep
TaskStepList
TaskCompletion
```

---

# 8. P1 Components

```text
AssistantActionGroup
RecordResult
SearchResult
OrganizeResult
ResultActionGroup

CandidateGroup

RecordInputModule
SearchModule
OrganizeModule
TodoModule
OrchestrationModule
```

P1 不是额外产品功能。

它表示：

> 当前 Phase 3 页面所需的支持性组件。

---

# 9. P2 / Future Components

以下不属于当前 Phase 3 实现要求：

```text
AI Avatar
AI Personality
Voice Character
Model Selector
Prompt Editor
Prompt Library
Agent Debugger
Workflow Editor
Tool Console
Reasoning Viewer
Token Usage Panel
```

Documentation does not authorize implementation.

---

# 10. CompanionLauncher

### Purpose

打开 FMN Companion。

### Variants

* Global
* Trip

### Semantic Meaning

* `Global` → Global Entry（Context = None）
* `Trip` → Trip Entry（Context = Current Trip）

Entry Type 是产品概念。
Variant 是组件实现概念。
两者不合并命名。

### States

* Default
* Hover
* Pressed
* Focus
* Disabled

### Rules

Launcher 只负责：

> 打开 Companion。

不负责：

* Intent Understanding
* Workflow Selection
* Task Execution
* Data Write

---

# 11. CompanionSurface

### Purpose

承载完整 Companion 交互。

### Structure

```text
CompanionSurface
├── CompanionHeader
├── ContextChip
├── ConversationArea
└── InputComposer
```

### Variants

* Global
* Trip
* Compact
* Expanded

### States

* Closed
* Opening
* Open
* Processing
* Waiting
* Completed
* Error

### Rules

CompanionSurface：

> 是交互容器。

不负责业务 Workflow。

打开方式为**页面内展开**，不换路由。

不提供左侧历史对话栏。

---

# 12. CompanionHeader

### Purpose

展示 Companion 身份与当前上下文。

### Structure

```text
CompanionHeader
├── Companion Mark
├── Title
└── Optional ContextChip
```

### Variants

* Global
* Trip

### Rules

不得设计成独立 AI Brand Header。

---

# 13. ContextChip

### Purpose

显示默认 Context。

### Variants

* CurrentTrip
* OtherTrip
* None

### States

* Default
* Active
* Updating

### Rules

表达：

> 当前默认上下文。

不表达：

> 权限限制。

当 Trip 未指定时，ContextChip 明确显示 `未指定`。

---

# 14. ConversationMessage

### Purpose

统一消息结构。

### Variants

* User
* Assistant
* SystemStatus

### Rules

不要设计成社交聊天系统。

---

# 15. UserMessage

### Purpose

展示用户输入。

### Variants

* Text
* Voice
* Receipt

### States

* Sending
* Sent
* Failed

---

# 16. AssistantMessage

### Purpose

展示 Companion Response。

### Variants

* Text
* Result
* Question
* Confirmation
* Error

### Structure

```text
AssistantMessage
├── Optional Text
├── Structured Content
└── Optional Actions
```

如果信息适合结构化：

> 使用对应 Business Component。

---

# 17. AssistantActionGroup

### Purpose

提供与 Assistant Response 对应的操作。

### Variants

* Inline
* Stacked

### Rules

Action 与相关结果保持空间邻近。

---

# 18. InputComposer

### Purpose

提供统一 Companion 输入。

### Structure

```text
InputComposer
├── Optional Attachment Action
├── Text Input
├── VoiceInput
└── SendButton
```

### Variants

* Global
* Trip
* Compact

### States

* Empty
* Focus
* Filled
* Sending
* Disabled

---

# 19. VoiceInput

### Purpose

提供 Voice 输入。

### States

* Idle
* Recording
* Processing
* Complete
* Error
* Disabled

### Rules

VoiceInput 负责：

> 输入采集与状态。

不负责业务理解。

---

# 20. ReceiptInput

### Purpose

提供 Receipt 输入。

### Variants

* Upload
* Camera
* Compact

### States

* Empty
* Uploading
* Preview
* Processing
* Success
* Error

### Rules

OCR / Vision / Product Splitting：

> 属于 F3-01 Workflow。

组件不负责。

Receipt Image 作为共享输入 / 附件引用，可以关联多个由其产生的 Record。

未 Confirm 的 Receipt Image 属于 Temporary Receipt Asset。

---

# 21. SendButton

### Purpose

发送用户输入。

### Rules

复用现有 Button System。

不要创建 AI-specific Button Style。

---

# 22. ProcessingIndicator

### Purpose

表示 Companion 正在处理。

### Variants

* Inline
* Full
* Minimal

### Content

例如：

```text
正在查询……
```

---

# 23. TaskStatus

### Purpose

表示当前 Task 状态。

### Variants

* Processing
* Waiting
* Completed
* Error
* Cancelled

### Rules

不直接暴露内部 Agent State Schema。

---

# 24. TaskProgress

### Purpose

展示复杂任务的用户可见进度。

### Variants

* Compact
* Expanded

### Rules

只显示用户可理解的执行阶段。

不得显示：

* Tool Name
* Function Name
* Prompt
* Chain of Thought
* Model Internals

---

# 25. ResultSection

### Purpose

组织结构化结果。

### Variants

* Single
* List
* Table
* Grouped
* Summary

### Rules

只负责展示组织，不负责业务计算。

---

# 26. RecordResult

### Purpose

展示 Shopping Record 结果。

### Rules

优先复用：

* ItemCard
* ItemMeta
* Price
* Location
* CategoryTag

不要创建平行 AI Record Card。

---

# 27. SearchResult

### Purpose

展示 F3-02 查询结果。

### Variants

* Product
* Trip
* User
* List

优先复用：

* SearchResultCard
* TripCard
* ItemCard

---

# 28. OrganizeResult

### Purpose

展示 F3-03 数据整理结果。

### Variants

* Summary
* Table
* GroupedTable

### Rules

统计计算属于 F3-03 Workflow。

如果 Table / Grouped Table 仅用于单一场景：

> 不强制新建独立 Table Component。

只有出现稳定复用需求时才抽象。

---

# 29. ResultActionGroup

### Purpose

提供结果相关操作。

例如：

```text
[查看全部]
[查看旅行]
[加入 Todo]
```

### Rules

Component 不自行决定操作合法性。

---

# 30. DraftCard

### Purpose

展示尚未正式写入的数据。

### Variants

* Record
* Todo
* Batch

### States

* Draft
* Editing
* Ready
* Confirmed
* Cancelled

---

# 31. DraftField

### Purpose

展示 Draft 字段。

### Variants

* Editable
* Readonly
* Missing
* Warning

### Rules

Missing Field 必须明确显示。

---

# 32. RecordDraft

### Purpose

展示 F3-01 Shopping Record Draft。

### Required Fields

```text
Trip
Product Name
Actual Paid Price
Currency
Purchase Date
```

### Optional Fields

```text
Purchase Location
Category
Product Image
Receipt Image Reference
Note
Quantity
```

### States

* Draft
* Editing
* Ready
* Confirmed

### Rules

遵守：

`docs/phase3-product.md`

Receipt Image 可以引用共享 Receipt，而不是要求每个 Record 复制一份 Receipt。

Quantity 默认 1，用户可在 Confirm 前修改。

Purchase Date 为 Draft 初始化优先级：Receipt Date → User Explicit Date → Current Date。

用户修改后的值 = 最终值。

---

# 33. TodoDraft

### Purpose

展示 F3-04 Shopping Todo Draft。

### Required Fields

```text
Trip
Product
reference_price
reference_currency
reference_location
```

### Optional Fields

```text
Quantity
Note
Target Purchase Date
Product Image
Category
```

### States

* Draft
* Editing
* Ready
* Confirmed

### Rules

不得创建缺少 Required Fields 的 Phase 3 New Todo。

### reference_location 语义

```text
reference_location = Target Purchase Location
  = 计划购买地点
```

Phase 3 不引入第二个独立的 Target Purchase Location 字段。

### Quantity 默认值

Quantity 默认显示为 1。

用户可在 Confirm 前修改。

### Legacy Todo

Legacy Todo 不强制补齐 Required Fields。

Legacy / New 判定由 `created_at` 与 Phase 3 Migration Boundary 决定。

---

# 34. BatchDraft

### Purpose

展示多个 Draft。

### Structure

```text
BatchDraft
├── DraftCard × N
└── UnifiedActions
```

### States

* Incomplete
* Ready
* WaitingConfirmation
* Confirmed
* Cancelled

### Rules

批量写入必须统一确认。

任一对象不完整时：

> 整个最终写入流程暂停。

不得部分正式写入。

对应 Decision：

* D5-02 Batch Atomic Write
* I-01 Batch Transaction Boundary

---

# 35. ConfirmationCard

### Purpose

展示即将执行的正式写操作。

### Variants

* Record
* Todo
* Batch

### States

* Ready
* Confirming
* Success
* Cancelled

### Rules

必须明确展示：

> 将写入什么。

只有明确的 Confirm Action 才代表正式写入。

不视为 Confirm：

* 被动浏览
* 滚动
* 关闭 Companion
* "看起来不错"
* "好的" / "嗯" / "继续"

---

# 36. ConfirmationActionGroup

### Purpose

提供：

```text
修改
确认
取消
```

### Rules

Confirm 是正式写入的前置条件。

---

# 37. MissingFieldPrompt

### Purpose

请求补充必填信息。

### Variants

* SingleField
* Choice
* MultipleChoice

### Rules

多个可能答案时：

> 不得静默选择。

---

# 38. CandidateSelector

### Purpose

让用户从多个候选对象中选择。

### Variants

* Product
* HistoricalProduct
* PublicProduct
* Todo

### States

* Idle
* Selected
* Confirming
* Disabled

---

# 39. CandidateCard

### Purpose

展示一个候选对象。

### 内容可包括：

* Product Image
* Product Name
* Price
* Currency
* Purchase Location
* Purchase Date
* Trip

### Rules

优先复用 ItemCard / SearchResultCard。

---

# 40. CandidateGroup

### Purpose

组织多个 Candidate。

### Rules

F3-04 Public Product Search：

> 首屏最多 5 个候选。

---

# 41. TaskSummary

### Purpose

展示当前复杂任务的用户目标。

### Rules

使用：

> 用户可理解的语言。

不显示内部 Task ID。

---

# 42. TaskStep

### Purpose

展示一个可理解的任务阶段。

### Variants

* Pending
* Processing
* Completed
* Waiting
* Error
* Cancelled

---

# 43. TaskStepList

### Purpose

组织多个 TaskStep。

### Rules

只显示用户需要理解的执行阶段。

---

# 44. TaskCompletion

### Purpose

展示任务完成。

### Variants

* Result
* Written
* Partial
* Cancelled

例如：

```text
✓ 已整理出 4 个商品
```

---

# 45. RecordInputModule

### Purpose

组织 F3-01 输入流程。

### Structure

```text
RecordInputModule
├── InputComposer
├── VoiceInput
└── ReceiptInput
```

业务执行由：

> F3-01 Workflow

负责。

---

# 46. SearchModule

### Purpose

组织 F3-02 查询结果。

### Rules

不重新实现 Search Workflow。

---

# 47. OrganizeModule

### Purpose

组织 F3-03 结果。

### Structure

```text
OrganizeModule
├── Query / Task Summary
├── OrganizeResult
└── ResultActionGroup
```

---

# 48. TodoModule

### Purpose

组织 F3-04 创建、选择与确认。

### Structure

```text
TodoModule
├── CandidateSelector
├── TodoDraft
├── ConfirmationCard
└── ConfirmationActionGroup
```

必须遵守：

```text
Trip
Product
reference_price
reference_currency
reference_location
```

---

# 49. OrchestrationModule

### Purpose

组织 F3-05 跨功能任务。

### Structure

```text
OrchestrationModule
├── TaskSummary
├── TaskStepList
├── Intermediate Result
├── Draft / Result
└── Confirmation
```

只负责：

> 展示和组织。

不负责执行 Agent Loop。

---

# 50. Existing Component Overrides

Phase 3 继续复用既有 Component Library。

以下组件在 Phase 3 中的业务语义以 Phase 3 Product Definition 为准。

---

## 50.1 ShoppingTodoCard Override

Phase 2 历史组件可能使用：

```text
ReferencePrice
ReferenceLocation
SourceInfo
```

Phase 3 正式 Todo 不采用上述概念作为核心 Todo 数据模型。

Phase 3 `ShoppingTodoCard` 应优先展示：

```text
Product
reference_price
reference_currency
reference_location
Quantity
Category
Note
Todo Status
Optional Target Purchase Date
```

Public Product Source：

> 只属于 Todo 创建过程中的信息来源。

不得把 Source 作为正式 Todo 的必需展示字段。

不得把 Public Product 的原始 Source 当作 Todo 的持久化身份。

---

## 50.2 ShoppingTodoButton Override

Phase 2 中"点击后直接加入 Todo"的表现：

> 不得绕过 Phase 3 Formal Todo Requirements。

Phase 3 中：

```text
User Action
↓
Todo Resolution
↓
Required Information Validation
↓
Todo Draft
↓
User Confirmation
↓
Create Todo
```

如果 Product、reference_price、reference_currency、reference_location、Trip 不完整：

> 不得直接创建正式 Todo。

---

## 50.3 PurchaseConversion Override

Phase 3 沿用：

> Shopping Todo → Shopping Record

的业务关系。

但 Conversion UI 不应继续依赖：

```text
ReferencePrice
ReferenceLocation
Source
```

作为 Todo 的核心数据概念。

Conversion 应优先读取当前用户自己的 Todo：

```text
Product
reference_price
reference_currency
reference_location
Quantity
Category
Note
```

然后按照 Shopping Record 的业务要求完成：

* Actual Paid Price
* Currency
* Purchase Date
* Actual Purchase Location
* Product Image
* Note
* Quantity

其中：

> reference_location（计划购买地点）

转换时：

```text
reference_location（计划）
        ↓
作为建议值预填
        ↓
用户确认 / 修改
        ↓
purchase_location（实际）
```

但 Actual Paid Price / Purchase Date 等 Record-specific information 仍必须遵守 F3-01 / Product Definition。

---

# 51. Existing Component Override Principle

Phase 3 的组件如果与 Phase 1 / Phase 2 历史组件存在语义冲突：

> Phase 3 Product Definition 优先。

不要修改历史文档以"重写过去"。

在 Phase 3 实现中：

> 使用当前 Phase 3 定义覆盖旧组件的过时业务语义。

---

# 52. Reuse and Composition Rules

优先：

```text
Existing Component
+
Composition
+
Variant
```

只有无法合理表达时：

> 创建新组件。

---

# 53. AI Component Duplication Rule

禁止：

```text
AIItemCard
AITripCard
AIButton
AIPrice
AIConfirmDialog
```

优先使用：

```text
Existing FMN Component
+
Composition
+
Variant
```

---

# 54. Component Responsibility

每个组件必须有：

> 一个清晰、稳定的职责。

组件可以拥有：

* presentation
* component-level interaction
* meaningful local state
* meaningful variants

组件不得拥有：

* Agent planning
* Workflow routing
* Product decisions
* business-rule decisions
* permission decisions
* database persistence
* unrelated page logic

---

# 55. Companion Component Boundary

Companion Components 可以展示：

* User Message
* Assistant Response
* Structured Result
* Draft
* Confirmation
* Task Progress

但不能直接执行：

* Agent Loop
* Tool Calling
* Workflow execution
* Formal Data Write

---

# 56. Logic Separation

保持：

```text
Presentation
Business Logic
Workflow
Data
```

推荐：

```text
UI Component
↓
Page / Application Layer
↓
Workflow / Business Logic
↓
Tool / Data Operation
↓
FMN Data
```

---

# 57. Variant vs State

Variant：

> 不同稳定用途或展示类型。

State：

> 当前状态。

例如：

```text
Variant:
Global / Trip / Compact / Expanded

State:
Default / Loading / Processing / Disabled
```

不要创建 Variant × State 的独立组件。

---

# 58. Public / Private

Public / Private 是业务规则。

Component 只负责：

> 展示状态与触发操作。

不得由 Component 自己决定是否允许公开。

优先：

```text
Existing Component
+
Visibility Variant / State
```

而不是：

```text
PublicTripCard
PrivateTripCard
PublicItemCard
PrivateItemCard
```

---

# 59. Result Components

优先复用：

```text
Record Result
→ Item / Record Component

Trip Result
→ TripCard

Search Result
→ SearchResultCard

Todo Result
→ ShoppingTodoCard

Statistics
→ Stat / Table
```

---

# 60. Page Composition

Pages 应：

* compose components
* connect data
* coordinate page-level state
* coordinate page-level actions

不要在 Page 中重新实现共享 UI。

---

# 61. Naming

使用：

> PascalCase

推荐：

```text
CompanionSurface
AssistantMessage
RecordDraft
TodoDraft
ConfirmationCard
TaskProgress
CandidateSelector
```

避免：

```text
Box
Block
Panel1
ComponentA
AIThing
ThailandTripCard
PinkProductCard
```

---

# 62. State Coverage

只定义组件真实需要的状态：

```text
Default
Hover
Pressed
Focus
Loading
Processing
Waiting
Disabled
Error
Selected
Completed
Cancelled
```

---

# 63. Future Components

Future Component：

> ≠ Current Requirement

文档中记录未来组件不代表当前自动实现。

---

# 64. Change Discipline

修改共享组件前：

* inspect current usages
* preserve valid behavior
* avoid unnecessary breaking changes
* prefer compatible variants
* update affected usages when required

不要为了单个页面重写共享组件。

---

# 65. Product / Design / Component Boundary

```text
phase3-product.md
        ↓
phase3-design-system.md
        ↓
phase3-component-library.md
```

Product：

> What

Design：

> How it looks

Component Library：

> Which reusable components

组件便利性不能改变产品行为。

---

# 66. Implementation Principle

Component Library 是：

> Architecture / Specification

不是：

> 当前必须一次性创建的整个组件库。

只实现当前 Phase 3 任务需要的组件。

---

# 67. Component File Organization

Phase 3 Coding 阶段建议：

```text
components/
└── companion/
    ├── conversation/
    ├── input/
    ├── progress/
    ├── result/
    ├── draft/
    ├── confirmation/
    ├── candidate/
    ├── task/
    └── modules/
```

只有实际需要时才创建对应文件。

---

# 68. Final Principle

> **Reuse before creating.**

> **Compose before duplicating.**

> **Variant before creating a new component.**

> **Keep Product, Business Logic, Workflow, and Presentation separate.**

> **Build only the components required by the current Phase 3 task.**

---

# 69. Document Status

**Version:** 1

**Status:** Phase 3 Component Definition — Complete

The Phase 3 component model is based on the existing FMN component architecture.

Phase 3 overrides the following inherited Todo semantics where necessary:

* ShoppingTodoCard
* ShoppingTodoButton
* PurchaseConversion

The authoritative Phase 3 business rules remain:

`docs/phase3-product.md`

The authoritative Phase 3 visual rules remain:

`docs/phase3-design-system.md`

The authoritative Phase 3 intelligent execution architecture remains:

`docs/phase3-intelligence-architecture.md`

The authoritative Phase 3 decision log remains:

`docs/phase3-decisions.md`

Phase 3 component specifications are defined in this document.
```

---


