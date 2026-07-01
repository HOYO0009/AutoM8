# TODO

## Next Vertical Slices

- [ ] Automation Builder: picker-backed Clarification Answers for applications, websites, email accounts, and recipients.
- [ ] Automation Builder: record desktop actions to create an automation.
- [ ] Editing: modify automations through manual graph edits or re-recording specific nodes.
- [ ] Run History: view previous runs, failures, screenshots, logs, token usage, and repair attempts.
- [ ] Insights: identify flaky nodes, expensive LLM calls, common failure reasons, and optimization opportunities.
- [ ] Dashboard: view automations, status, last run, success rate, run duration, and cost indicators.

## In Progress

- [ ] None.

## Module Integrations

- [x] automation-builder: prompt-based draft creation, saved automations, and prompt edits share validation and generation-boundary behavior.

## Completed

- [x] Documentation foundation.
- [x] Automation Builder / prompt-to-draft-automation: block incomplete drafts with Clarification Questions, send full Clarification Answer context, reject meta/status draft nodes and unresolved blockers, repair one parsed invalid model result, and show safe diagnostics when generation still cannot be validated.
- [x] Automation Builder / picker-backed-clarification-answers: choose local files and spreadsheets through a Windows picker and send the selected path as a normal Clarification Answer.
- [x] Automation Builder / save-draft-automation: save a generated draft as a locally persisted saved automation and delete saved automations without active runs.
- [x] Automation Builder / edit-saved-automation-with-prompt: use a saved automation as context, preview a complete edited draft, and replace the saved automation in place.
- [x] Automation Runner / Run deterministic saved automation: execute concrete saved actions through the Windows desktop driver and show step evidence.
- [x] Automation Runner / Approval-gated run actions: pause side-effect actions for approval and resume or fail from the user's decision.
- [x] Automation Runner / Run non-deterministic desktop task with screenshot/accessibility perception.
- [x] Node Graph Viewer / Inspect automation graph: inspect draft and saved automation nodes with current metadata and latest-run context.
