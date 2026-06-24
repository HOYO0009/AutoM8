# Glossary

## Product

| Term | Meaning | Owner/Context |
|---|---|---|
| Automation | A saved desktop workflow that can be inspected, edited, run, and monitored. | Product |

## Automation Builder

| Term | Meaning | Owner/Context |
|---|---|---|
| Automation Builder | The module where a user creates an automation from a prompt or, in later slices, recorded desktop actions. | Builder |
| Automation graph | The editable node graph representation of an automation. | Builder, runtime |
| Draft automation | An unsaved automation preview generated from a user prompt, with a name, summary, and ordered steps. | Builder |
| Saved automation candidate | Prototype term for a generated draft automation saved in memory with an ID and creation time, but not executed or persisted across server restart. | Builder |

## Automation Runner

| Term | Meaning | Owner/Context |
|---|---|---|
| Automation run | A recorded attempt to run a saved automation candidate, including timestamps, overall status, and per-step results. | Runner |
| Executable action plan | The ordered runtime plan for an automation run, made of executable actions grouped by automation step. | Runner |
| Hybrid runner | The Windows-first runner that executes deterministic actions directly, pauses side effects for approval, and runs non-deterministic desktop tasks from screenshot and accessibility evidence. | Runner |
| Approval gate | A run pause that requires the user to approve a side-effect action before AutoM8 continues. | Runner, safety |

## Runtime

| Term | Meaning | Owner/Context |
|---|---|---|
| Deterministic node | A node that performs a predictable action such as opening an app, clicking a UI element, typing text, pressing a hotkey, reading or writing a file, running a script, calling an API, parsing data, waiting for a window, or validating state. | Runtime |
| Perception node | A node that reads desktop state through screenshots, accessibility data, active-window data, visible text, clipboard contents, or UI-state detection. | Runtime |
| LLM node | A node that uses model reasoning for user-intent interpretation, classification, ambiguous extraction, UI-target selection, repair, or automation-logic modification. | Runtime |
| Control node | A node that manages flow through branching, looping, retries, timeouts, pauses, approval requests, fallbacks, or stopping execution. | Runtime |
| Verification node | A node that checks whether an action succeeded or confirms expected state, output files, or before/after values. | Runtime |
| Human approval gate | A pause in an automation that asks the user to approve an important action before continuing. | Runtime, safety |
| Executable action | A validated runner command such as launching an app, focusing a window, opening a URL, typing text, pressing a hotkey, clicking, waiting, verifying text, requesting approval, or entering a non-deterministic desktop task. | Runtime |
| Non-deterministic desktop task | A runner behavior where ambiguous UI work is driven by real screenshot/accessibility evidence, bounded model-selected actions, and after-action verification. | Runtime |

## Monitoring and Insights

| Term | Meaning | Owner/Context |
|---|---|---|
| Run history | A record of past automation runs, including failures, screenshots, logs, token usage, and repair attempts. | Dashboard, insights |
| Repair attempt | An LLM-assisted or user-guided attempt to recover from a failed or flaky automation step. | Runtime, insights |
