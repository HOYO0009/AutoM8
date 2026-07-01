# DDD

Purpose:
Keep domain language consistent across code, UI, APIs, tests, and vertical-slice documentation.

## Ubiquitous Language

| Term | Meaning | Owner/Context | Code/UI/API References |
|---|---|---|---|
| Automation | A saved desktop workflow that can be inspected, edited, run, and monitored. | Product | `shared/automationDraft.ts`, `documentation/vertical-slices/automation-builder/save-draft-automation.md` |
| Automation Builder | The module where a user creates an automation from a prompt or, in later slices, recorded desktop actions. | Builder | `documentation/vertical-slices/automation-builder/README.md` |
| Automation graph | The inspectable node graph representation of an automation, backed today by ordered draft steps and prepared for future editing. | Builder, runtime | `documentation/vertical-slices/node-graph-viewer/inspect-automation-graph.md`, `shared/automationGraph.ts`, `src/nodeGraphViewer/NodeGraphViewer.tsx` |
| Draft Automation Creation | The Automation Builder behavior that turns a workflow prompt and optional Clarification Answers into either Clarification Questions or a Draft Automation. | Builder | `documentation/vertical-slices/automation-builder/prompt-to-draft-automation.md`, `server/automation-builder/draftAutomationCreation.ts`, `src/automationBuilder/useAutomationWorkspace.ts` |
| Draft automation | An unsaved automation preview generated from a user prompt and any required Clarification Answers, with a name, summary, ordered steps, and Draft Step Details. | Builder | `server/automation-builder/draftAutomationCreation.ts`, `shared/draftValidation.ts`, `server/automation-builder/draftAutomationCreation.test.ts` |
| Clarification Question | A specific question AutoM8 asks when a workflow prompt is missing an Execution Blocker required before Draft Automation Creation can continue. | Builder | `shared/automationDraft.ts`, `src/automationBuilder/ClarificationPanel.tsx` |
| Clarification Answer | A user-provided answer carried with the Clarification Question ID, question text, and reason so the model can connect answered Execution Blockers to Draft Step Details or ask a more specific blocker question. | Builder | `shared/automationDraft.ts`, `shared/draftValidation.ts`, `src/automationBuilder/useAutomationWorkspace.ts` |
| Clarification Answer Kind | The input mode AutoM8 assigns to a Clarification Question: `text`, `local_file`, or `local_spreadsheet`. | Builder | `shared/automationDraft.ts`, `shared/draftValidation.ts`, `server/automation-builder/draftAutomationCreation.ts` |
| Picker-backed Clarification Answer | A file or spreadsheet Clarification Answer selected through the local Windows picker and then sent as the normal answer string. | Builder | `documentation/vertical-slices/automation-builder/picker-backed-clarification-answers.md`, `server/automation-builder/clarificationAnswerPicker.ts`, `src/automationBuilder/ClarificationPanel.tsx` |
| Execution Blocker | A missing execution-critical fact such as the exact file, app, website, spreadsheet tab, data range, account, recipient, schedule, time zone, or side-effect target. | Builder, runtime safety | `server/automation-builder/draftAutomationCreation.ts`, `documentation/vertical-slices/automation-builder/prompt-to-draft-automation.md` |
| Draft Step Details | Modeled inputs, outputs, fallbacks, and verification for one Draft Automation step. | Builder, graph inspection | `shared/automationDraft.ts`, `shared/automationGraph.ts`, `src/nodeGraphViewer/NodeGraphViewer.tsx` |
| Saved automation | A generated Draft Automation saved with an ID and creation time in local repo storage so it survives browser reloads and API server restarts while the local data file remains. It is not database-backed or synced. | Builder | `server/automation-builder/savedAutomationStore.ts`, `server/automation-builder/savedAutomationStore.test.ts` |
| Saved Automation Prompt Edit | The behavior where a user describes a change to an existing saved automation and AutoM8 uses that saved automation as context to create a complete edited Draft Automation. | Builder | `documentation/vertical-slices/automation-builder/edit-saved-automation-with-prompt.md`, `server/automation-builder/draftAutomationCreation.ts`, `src/automationBuilder/useAutomationWorkspace.ts` |
| Automation run | A recorded attempt to run a saved automation, including timestamps, overall status, and per-step results. | Runner | `server/automation-runner/automationRunStore.ts`, `server/automation-runner/automationRunStore.test.ts` |
| Run cancellation | A user or API request that stops an active Automation run, marks the run as cancelled, records completion time, and skips unfinished steps. | Runner | `shared/automationRun.ts`, `server/app.ts`, `server/automation-runner/automationRunStore.ts` |
| Executable action plan | The ordered runtime plan for an automation run, made of executable actions grouped by automation step. | Runner | `server/automation-runner/executableActionPlanner.ts`, `server/automation-runner/executableActionRegistry.ts`, `server/automation-runner/executableActionPlanner.test.ts` |
| Hybrid runner | The Windows-first runner that executes deterministic actions directly, pauses side effects for approval, and runs non-deterministic desktop tasks from screenshot and accessibility evidence. | Runner | `documentation/vertical-slices/automation-runner/README.md` |
| Windows desktop driver | The local infrastructure boundary that observes and controls Windows desktop state for deterministic actions and non-deterministic desktop tasks. | Runner, infrastructure | `server/desktop/desktopDriver.ts`, `documentation/vertical-slices/automation-runner/run-saved-automation.md` |
| Approval gate | A run pause that requires the user to approve a side-effect action before AutoM8 continues. A specific approval request is represented in code as `AutomationApproval`. | Runner, safety | `shared/automationRun.ts`, `server/automation-runner/automationRunStore.ts`, `documentation/vertical-slices/automation-runner/approval-gated-run-actions.md` |
| Deterministic node | A node that performs a predictable action such as opening an app, clicking a UI element, typing text, pressing a hotkey, reading or writing a file, running a script, calling an API, parsing data, waiting for a window, or validating state. | Runtime | `documentation/vertical-slices/node-graph-viewer/inspect-automation-graph.md`, `shared/automationDraft.ts` |
| Perception node | A node that reads desktop state through screenshots, accessibility data, active-window data, visible text, clipboard contents, or UI-state detection. | Runtime | `documentation/vertical-slices/node-graph-viewer/inspect-automation-graph.md`, `shared/automationDraft.ts` |
| LLM node | A node that uses model reasoning for user-intent interpretation, classification, ambiguous extraction, UI-target selection, repair, or automation-logic modification. | Runtime | `documentation/vertical-slices/node-graph-viewer/inspect-automation-graph.md`, `shared/automationDraft.ts` |
| Control node | A node that manages flow through branching, looping, retries, timeouts, pauses, approval requests, fallbacks, or stopping execution. | Runtime | `documentation/vertical-slices/node-graph-viewer/inspect-automation-graph.md`, `shared/automationDraft.ts` |
| Verification node | A node that checks whether an action succeeded or confirms expected state, output files, or before/after values. | Runtime | `documentation/vertical-slices/node-graph-viewer/inspect-automation-graph.md`, `shared/automationDraft.ts` |
| Executable action | A validated runner command such as launching an app, focusing a window, opening a URL, typing text, pressing a hotkey, clicking, waiting, verifying text, requesting approval, or entering a non-deterministic desktop task. | Runtime | `server/automation-runner/executableActionRegistry.ts`, `server/automation-runner/executableActionPlanner.ts`, `server/automation-runner/executableActionRegistry.test.ts` |
| Non-deterministic desktop task | A runner behavior where ambiguous UI work is driven by real screenshot/accessibility evidence, bounded model-selected actions, and after-action verification. | Runtime | `server/automation-runner/nonDeterministicDesktopTaskRunner.ts`, `server/automation-runner/nonDeterministicDesktopTaskRunner.test.ts` |
| Run history | A record of past automation runs, including failures, screenshots, logs, token usage, and repair attempts. | Dashboard, insights | TODO: Map during Run History slice. |
| Repair attempt | An LLM-assisted or user-guided attempt to recover from a failed or flaky automation step. | Runtime, insights | TODO: Map during repair behavior slice. |

## Domain Concepts

| Concept | Invariants / Rules | Related slices/modules | Notes |
|---|---|---|---|
| Automation graph inspection | The viewer must expose modeled automation facts directly from draft or saved automation data; inputs, outputs, fallbacks, and verification come from Draft Step Details and are shown as not modeled yet only when those detail lists are empty. | Node Graph Viewer | Latest-run context may annotate nodes, but it must not imply unavailable graph metadata exists. |
| Draft Automation Creation boundary | A shape-valid `draft_created` model response must still describe chronological workflow-action nodes and must not contain unresolved Execution Blockers before it becomes UI-visible. | Automation Builder | AutoM8 treats meta/status nodes such as blocker-resolution or draft-created status steps as repairable provider output defects, not automation graph nodes. |
| Picker-backed Clarification Answers | Picker output fills `ClarificationAnswer.answer`; it does not create a separate answer protocol or graph metadata path. | Automation Builder | Current picker-backed kinds are local file and local spreadsheet only. |
| Saved Automation Prompt Edit | Prompt edits return a complete edited Draft Automation, not a patch. Saving the edited draft replaces the saved automation in place and clears stale latest-run context for that automation. | Automation Builder | Replacement preserves the saved automation ID and creation time while updating name, summary, and steps. |
| Run cancellation | Cancelling an active Automation run sets the run status to `cancelled`, records `completedAt`, marks unfinished pending, running, or approval-waiting steps as skipped, and leaves completed, failed, or already-cancelled runs unchanged. | Automation Runner | Saved automation edits and deletes are blocked while an active run exists; the user must finish or cancel that run first. |

## Naming Conventions

| Domain idea | Preferred name | Avoid | Reason |
|---|---|---|---|
| Prompt-to-draft behavior | Draft Automation Creation | Generator result, draft generation result, LLM result | User-visible docs, UI, tests, API DTOs, and implementation filenames should use domain language such as `draftAutomationCreation`. |
| Prompted edit behavior | Saved Automation Prompt Edit | Patch, diff-only edit | The user-visible behavior previews a full edited Draft Automation before replacing the saved automation. |
| Missing required workflow fact | Execution Blocker | Missing detail, vague field | Identifies facts that block Draft Automation Creation instead of optional polish. |
| Question before draft creation | Clarification Question / Clarification Answer | Follow-up prompt, chat question | Keeps the builder flow precise without implying a chat session or server-side conversation state. |
| Clarification input mode | Clarification Answer Kind | Picker type, answer type | Names the UI/input mechanism without changing the Clarification Answer payload sent back to the model. |

## Open Language Questions

| Question | Context | Next action |
|---|---|---|
