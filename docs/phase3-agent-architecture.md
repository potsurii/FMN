# FMN Phase 3 — Agent Architecture

**Version:** 1.1  
**Status:** Architecture Baseline for Batch 5 Planning  
**Scope:** FMN Companion Agent Control Layer  
**Parent Architecture:** `docs/phase3-intelligence-architecture.md`

---

## 1. Purpose

FMN Companion Agent is a bounded task controller that coordinates existing FMN capabilities to complete a user's request.

The Agent is not:
- A standalone chatbot or a new product surface.
- A replacement for existing Workflows or domain logic.
- An unrestricted autonomous agent.
- A direct database writer.
- A fallback invoked only after an LLM or Workflow fails.

The Agent starts managing a task from the user's initial request. It determines the next appropriate action from the interpreted intent, available parameters, current task state, actual Workflow results, and subsequent user input.

The implementation must remain incremental and reuse existing Phase 3 infrastructure.

## 2. Relationship to Existing Documents

This document defines the Agent control layer. It does not replace existing sources of truth.

| Document | Responsibility |
|---|---|
| `phase3-product.md` | Product scope, user-visible behavior, required user interactions |
| `phase3-decisions.md` | Closed product, design, and implementation-boundary decisions |
| `phase3-intelligence-architecture.md` | Existing intelligence, LLM, Workflow, Draft, and data-access boundaries |
| `phase3-current-state.md` | What is actually implemented in the repository |
| `phase3-design-system.md` | Visual and interaction design rules |
| `phase3-component-library.md` | Existing component contracts |
| `.cursor/rules/phase3-*.mdc` | Coding constraints for the relevant files |
| `phase3-agent-architecture.md` | Agent responsibilities, control loop, task-state behavior, and implementation boundaries |

When rules differ:
1. Closed Product Owner decisions and product rules govern user-visible behavior and data semantics.
2. Existing intelligence architecture governs established system boundaries.
3. This document specifies the Agent control layer within those boundaries.
4. Current-state documentation and source code establish what is already implemented, not what is automatically approved.
5. Technical implementation choices must not silently change product decisions.

If an implementation requirement cannot be satisfied within these constraints, report the concrete blocker rather than inventing a new product rule.

## 3. Core Responsibility Boundaries

### 3.1 Companion

Companion provides the interaction surface and connects user input, task feedback, Draft review, and explicit confirmation.

It is not responsible for independently implementing the entire task decision process inside UI components.

### 3.2 Agent

The Agent:
- Maintains the current task's execution state.
- Determines the user's intended task and required information.
- Decides whether to ask a question, invoke a Workflow, interpret a result, continue, pause, or terminate.
- Uses actual Workflow outcomes to determine the next step.
- Avoids repeating steps that have already completed successfully.
- Preserves existing confirmation and write-safety requirements.

### 3.3 LLM / Natural Language Understanding

The LLM may help interpret natural-language intent, extract structured parameters, resolve common linguistic variations, and identify uncertainty.

The LLM does not:
- Directly read or mutate the database outside approved interfaces.
- Bypass existing Workflows.
- Treat a generated interpretation as proof that an operation succeeded.
- Silently invent missing user-specific facts.
- Decide product policy or override closed decisions.

Use deterministic parsing for clear, well-defined patterns when appropriate. Use the configured LLM when natural-language interpretation is needed. The Agent is the controller that coordinates these capabilities; neither the parser nor the LLM alone is the Agent.

### 3.4 Workflow

A Workflow performs a defined business operation, validates its inputs, applies established business rules, and returns a structured result.

The Agent should call existing Workflows rather than duplicate their business logic. Existing authorization, ownership, RLS, validation, and data-access boundaries remain authoritative.

### 3.5 Tools and Data Access

Tools are bounded interfaces to existing application capabilities. They must not create an alternate path around approved Workflow or data-access boundaries.

Formal database writes continue through the existing validated write path.

## 4. Agent Control Loop

The Agent follows this bounded control loop:

```text
User Input
    ↓
Interpret Intent and Context
    ↓
Build / Update Task State
    ↓
Check Required Parameters and Preconditions
    ├── Missing or materially ambiguous
    │       ↓
    │   Ask User / Pause
    │       ↓
    │   Receive Answer
    │       ↓
    │   Update Existing Task State
    │
    └── Ready
            ↓
        Select Existing Workflow(s)
            ↓
        Execute Approved Workflow
            ↓
        Inspect Actual Structured Result
            ├── Completed → Return Result
            ├── Needs User Input → Pause and Ask
            ├── Partial Completion → Preserve Completed Steps
            ├── Recoverable Failure → Decide a Bounded Next Action
            └── Cancelled / Non-recoverable → Stop Safely
```

The loop is bounded. It must not repeatedly call the same action without new information or a justified change in state.

The Agent's next action must be supported by at least one of:
- The original request and its reliable interpretation.
- Validated parameters.
- The current task state.
- An actual Workflow result.
- A subsequent user answer or explicit confirmation.

The Agent must not infer successful execution from an LLM response or from the fact that a tool was called.

## 5. Intent and Data Scope

The Agent must distinguish personal-record tasks from public product discovery.

| User intent | Expected route |
|---|---|
| “我买过的所有防晒霜” | F3-02: query the user's own Shopping Record history |
| “帮我整理那霸的购物记录” | F3-03: organize the user's own Shopping Records, using destination as a filter when reliably established |
| “我想买一款防晒霜” | Public FMN Shopping Records discovery and reference, when an approved callable capability exists |
| A task that requires two or more Workflows | F3-05 multi-Workflow orchestration, only when genuinely needed |

Destination alone does not change personal-record scope into public-search scope.

F3-02 remains read-only access to the user's own history. Public search and own-history data access remain separate. The Agent must not bypass this separation to make an unsupported request appear to work.

If a required capability is not callable from Companion, treat it as a capability gap. Do not fabricate results or query another data scope as a substitute.

## 6. Context and Target Trip

Context is a default working context, not an authorization boundary.

### Global Entry

- Context is `None`.
- The user may query their own history across Trips.
- A write Draft may exist without a selected Trip only where the existing product rules permit it.
- A formal write must not silently select a Trip; the required Trip must be supplied before confirmation and validated by the existing write path.

### Trip Detail Entry

- Context defaults to the current Trip.
- The user may still query other Trips or their wider history.
- A non-current Trip write requires explicit target confirmation under the existing product rules.

### “Recent” Resolution

Preserve the closed L-03 semantics:
- “最近” is not a rolling 7-, 30-, or 90-day window.
- It refers to the most recent started Trip with Shopping Records, according to the existing resolution rules.
- In a valid Trip Entry, use the current Trip when the existing L-03 preconditions are satisfied.
- Otherwise, preserve the existing candidate-generation and selection behavior.

Do not reimplement or redefine L-03 as part of Agent work.

For a task whose wording explicitly requires confirmation of a target Trip, follow that task's confirmation rule. Do not generalize a task-specific exception into a change to L-03.

## 7. Natural-Language Understanding and Parameter Reliability

Users may express the same destination, filter, or task in different ways. The Agent should improve the reliability of understanding before invoking the existing Workflow.

### 7.1 Interpretation

The interpretation stage should produce a structured representation of:
- Intended operation.
- Data scope.
- Relevant filters and parameters.
- Target Trip, if required.
- Missing or uncertain information.
- Whether user clarification or confirmation is required.

Reuse existing parse types and Workflow input contracts where possible. Do not introduce duplicate parameter models without a demonstrated need.

### 7.2 Parameter Confidence and Clarification

- A clearly understood parameter may be passed to the existing Workflow.
- A plausible but materially ambiguous parameter must be clarified or confirmed when the ambiguity changes the result.
- A missing required parameter must not be silently invented.
- User-specific facts such as purchase location, actual price, Trip identity, and purchase date must not be fabricated.
- A failed interpretation must not silently remove the corresponding filter and broaden the query.

If the Agent cannot reliably resolve a destination from natural language, it should ask for clarification or use a supported resolution path. It must not compensate by weakening the existing Workflow's filter semantics.

### 7.3 Separate Understanding Failure from Execution Failure

A request can fail at different stages:

1. Intent was misunderstood.
2. A parameter was missing or interpreted incorrectly.
3. A valid parameter was passed, but the Workflow behaved incorrectly.
4. The Workflow returned an expected empty result.
5. The required capability does not exist or is not callable.

The Agent should preserve enough structured state and result information to distinguish these cases. Do not label every unexpected result as a Workflow defect, and do not treat every failure as an LLM problem.

## 8. Workflow Selection and Orchestration

Use the simplest valid execution path.

- If one existing Workflow can satisfy the request, invoke that Workflow.
- Invoke multiple Workflows only when the task actually requires two or more distinct business operations.
- Do not create a multi-Workflow plan solely because the Agent exists.
- Do not rerun successful operations merely because a later operation needs clarification.
- Do not silently change the task's data scope or required filters after a failure.

For multi-Workflow tasks, preserve dependencies and actual intermediate results. Execute a later step only when its prerequisites are satisfied.

F3-05 is orchestration across existing Workflows, not a replacement for their internal business logic.

## 9. Task State, Pause, Resume, and Cancel

Task state is execution state, not persistent conversation history.

A task may need to retain:
- Original user request.
- Interpreted intent and validated parameters.
- Current task status.
- Completed steps and their relevant results.
- Current pending question or unresolved condition.
- The next expected action, where needed.
- Whether the task is paused or cancelled.

Use the smallest state representation that supports the current Batch 5 requirements. Reuse existing task and Draft types where appropriate. Do not introduce a generic task engine, event-sourcing framework, or unnecessary schema solely for theoretical future cases.

### Pause

Pause when the next valid step requires user input or a required precondition is not satisfied.

Preserve the original request and valid completed work. Clearly identify what information is needed to continue.

### Resume

When the user answers:
- Associate the answer with the pending question.
- Update the relevant parameter or task state.
- Revalidate the remaining preconditions.
- Continue from the next incomplete step.
- Do not repeat successful steps unless their results are no longer valid or a documented dependency requires re-execution.

### Cancel

Cancellation terminates the current task. No later step may continue merely because it was already planned.

Use existing cleanup behavior for temporary assets and Drafts. Do not introduce unrelated cleanup or persistence changes.

### Persistence Boundary

Preserve the closed conversation and Draft lifecycle decisions:
- Conversation history remains in memory only and is not written to a conversation database.
- Draft persistence follows the existing localStorage and expiration rules.
- Task-state persistence must reuse the existing task-storage boundary unless an approved implementation decision establishes a necessary change.

Do not assume the current task-storage implementation

## 10. Tool Proposal Protocol（Model B）

### Loop

```text
User Input
    ↓
Agent assembles request (including tool list + current context)
    ↓
Invoke LLM
    ↓
LLM returns: Text | Tool Proposal
    ↓
Agent validates proposal
├─ Whitelisted? → No → Reject + Feedback
├─ Parameters valid? → No → Ask user
├─ Confirmation required? → Yes → Pause for confirmation
└─ Yes → Execute tool
    ↓
Return result to LLM
    ↓
LLM decides: Continue / Complete / Follow-up
    ↓
Loop (max 6 steps)

### Context Passed to LLM

Each request includes:
- Current user input
- Current Trip context (entry / tripId)
- Current TaskState (goal / completedSteps / pendingQuestions)
- Allowed tool list (functionDeclarations)
- Minimal necessary history (do not send full records)

### Security Boundaries (Unchanged)

- LLM proposes → Agent executes
- Official write tool (confirmWrite) is not exposed to LLM
- Draft → Review → Explicit Confirm → Write cannot be bypassed
- LLM cannot directly write to DB