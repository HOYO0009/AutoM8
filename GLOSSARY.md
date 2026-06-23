# Glossary

| Term | Meaning | Owner/Context |
|---|---|---|
| Automation | A saved desktop workflow that can be inspected, edited, run, and monitored. | Product |
| Automation Builder | The module where a user creates an automation from a prompt or, in later slices, recorded desktop actions. | Builder |
| Automation graph | The editable node graph representation of an automation. | Builder, runtime |
| Draft automation | An unsaved automation preview generated from a user prompt, with a name, summary, and ordered steps. | Builder |
| Deterministic node | A node that performs a predictable action such as opening an app, clicking a UI element, typing text, pressing a hotkey, reading or writing a file, running a script, calling an API, parsing data, waiting for a window, or validating state. | Runtime |
| Perception node | A node that reads desktop state through screenshots, accessibility data, active-window data, visible text, clipboard contents, or UI-state detection. | Runtime |
| LLM node | A node that uses model reasoning for user-intent interpretation, classification, ambiguous extraction, UI-target selection, repair, or automation-logic modification. | Runtime |
| Control node | A node that manages flow through branching, looping, retries, timeouts, pauses, approval requests, fallbacks, or stopping execution. | Runtime |
| Verification node | A node that checks whether an action succeeded or confirms expected state, output files, or before/after values. | Runtime |
| Human approval gate | A pause in an automation that asks the user to approve an important action before continuing. | Runtime, safety |
| Run history | A record of past automation runs, including failures, screenshots, logs, token usage, and repair attempts. | Dashboard, insights |
| Repair attempt | An LLM-assisted or user-guided attempt to recover from a failed or flaky automation step. | Runtime, insights |
