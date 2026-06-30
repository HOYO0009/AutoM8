# Automation Runner

Purpose:
Summarize integrated Automation Runner behavior across saved automation execution, approval gates, and non-deterministic desktop tasks.

Status: In progress

Integrated slices:
- `run-saved-automation.md`
- `approval-gated-run-actions.md`
- `run-nondeterministic-desktop-task.md`

Integrated behavior:
- Given a user has saved an automation candidate
- When they start a run
- Then AutoM8 creates an asynchronous run from an executable action plan
- And deterministic actions execute through the Windows desktop driver
- And side-effect actions pause for approval before continuing
- And non-deterministic desktop tasks use screenshot and accessibility evidence, execute one model-selected action at a time, verify from fresh evidence, and pause for approval when needed
- And executable action schemas, validation, and bounded non-deterministic action subsets come from the runner action registry
