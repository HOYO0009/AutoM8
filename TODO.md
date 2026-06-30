# TODO

## Next Vertical Slices

- [ ] Automation Builder: picker-backed Clarification Answers for files, spreadsheets, applications, websites, email accounts, and recipients.
- [ ] Automation Builder: record desktop actions to create an automation.
- [ ] Editing: modify automations through manual graph edits or re-recording specific nodes.
- [ ] Run History: view previous runs, failures, screenshots, logs, token usage, and repair attempts.
- [ ] Insights: identify flaky nodes, expensive LLM calls, common failure reasons, and optimization opportunities.
- [ ] Dashboard: view automations, status, last run, success rate, run duration, and cost indicators.

## In Progress

- [ ] None.

## Module Integrations

- [ ] None.

## Completed

- [x] Documentation foundation.
- [x] Automation Builder / Clarification-gated Draft Automation Creation: block incomplete drafts with Clarification Questions before creating a Draft Automation.
- [x] Automation Builder / Save draft automation: save a generated draft as an in-memory automation candidate.
- [x] Automation Builder / Edit saved automation with prompt: use a saved automation as context, preview a complete edited draft, and replace the saved candidate in place.
- [x] Automation Runner / Run deterministic saved automation: execute concrete saved actions through the Windows desktop driver and show step evidence.
- [x] Automation Runner / Approval-gated run actions: pause side-effect actions for approval and resume or fail from the user's decision.
- [x] Automation Runner / Run non-deterministic desktop task with screenshot/accessibility perception.
- [x] Node Graph Viewer / Inspect automation graph: inspect draft and saved automation nodes with current metadata and latest-run context.
