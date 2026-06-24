# DDD

Purpose:
Keep domain language consistent across code, UI, APIs, tests, and vertical-slice documentation.

## Ubiquitous Language

| Term | Meaning | Owner/Context | Code/UI/API References |
|---|---|---|---|
| Automation | A saved desktop workflow that can be inspected, edited, run, and monitored. | Product | TODO: Map during persistence and dashboard slices. |
| Automation Builder | The module where a user creates an automation from a prompt or, in later slices, recorded desktop actions. | Builder | `documentation/vertical-slices/automation-builder/README.md` |
| Automation graph | The editable node graph representation of an automation. | Builder, runtime | TODO: Map during Node Graph Viewer slice. |
| Draft automation | An unsaved automation preview generated from a user prompt, with a name, summary, and ordered steps. | Builder | `server/automation-builder/draftGenerator.ts`, `server/automation-builder/draftGenerator.test.ts` |
| Saved automation candidate | Prototype term for a generated draft automation saved in memory with an ID and creation time, but not executed or persisted across server restart. | Builder | `server/automation-builder/savedAutomationCandidateStore.ts`, `server/automation-builder/savedAutomationCandidateStore.test.ts` |
| Automation run | A recorded attempt to run a saved automation candidate, including timestamps, overall status, and per-step results. | Runner | `server/automation-runner/automationRunStore.ts`, `server/automation-runner/automationRunStore.test.ts` |
| Executable action plan | The ordered runtime plan for an automation run, made of executable actions grouped by automation step. | Runner | `server/automation-runner/executableActionPlanner.ts`, `server/automation-runner/executableActionPlanner.test.ts` |
| Hybrid runner | The Windows-first runner that executes deterministic actions directly, pauses side effects for approval, and runs non-deterministic desktop tasks from screenshot and accessibility evidence. | Runner | `documentation/vertical-slices/automation-runner/README.md` |
| Approval gate | A run pause that requires the user to approve a side-effect action before AutoM8 continues. | Runner, safety | `documentation/vertical-slices/automation-runner/approval-gated-run-actions.md` |
| Deterministic node | A node that performs a predictable action such as opening an app, clicking a UI element, typing text, pressing a hotkey, reading or writing a file, running a script, calling an API, parsing data, waiting for a window, or validating state. | Runtime | TODO: Map during Node Graph Viewer slice. |
| Perception node | A node that reads desktop state through screenshots, accessibility data, active-window data, visible text, clipboard contents, or UI-state detection. | Runtime | TODO: Map during Node Graph Viewer slice. |
| LLM node | A node that uses model reasoning for user-intent interpretation, classification, ambiguous extraction, UI-target selection, repair, or automation-logic modification. | Runtime | TODO: Map during Node Graph Viewer slice. |
| Control node | A node that manages flow through branching, looping, retries, timeouts, pauses, approval requests, fallbacks, or stopping execution. | Runtime | TODO: Map during Node Graph Viewer slice. |
| Verification node | A node that checks whether an action succeeded or confirms expected state, output files, or before/after values. | Runtime | TODO: Map during Node Graph Viewer slice. |
| Human approval gate | A pause in an automation that asks the user to approve an important action before continuing. | Runtime, safety | `server/automation-runner/automationRunStore.ts`, `documentation/vertical-slices/automation-runner/approval-gated-run-actions.md` |
| Executable action | A validated runner command such as launching an app, focusing a window, opening a URL, typing text, pressing a hotkey, clicking, waiting, verifying text, requesting approval, or entering a non-deterministic desktop task. | Runtime | `server/automation-runner/executableActionPlanner.ts`, `server/automation-runner/executableActionPlanner.test.ts` |
| Non-deterministic desktop task | A runner behavior where ambiguous UI work is driven by real screenshot/accessibility evidence, bounded model-selected actions, and after-action verification. | Runtime | `server/automation-runner/nonDeterministicDesktopTaskRunner.ts`, `server/automation-runner/nonDeterministicDesktopTaskRunner.test.ts` |
| Run history | A record of past automation runs, including failures, screenshots, logs, token usage, and repair attempts. | Dashboard, insights | TODO: Map during Run History slice. |
| Repair attempt | An LLM-assisted or user-guided attempt to recover from a failed or flaky automation step. | Runtime, insights | TODO: Map during repair behavior slice. |

## Domain Concepts

| Concept | Invariants / Rules | Related slices/modules | Notes |
|---|---|---|---|

## Naming Conventions

| Domain idea | Preferred name | Avoid | Reason |
|---|---|---|---|

## Open Language Questions

| Question | Context | Next action |
|---|---|---|
