# Clarification-Gated Draft Automation Creation

Status: Done

End-to-end behavior:
- Given a user has a desktop workflow they want to automate and configured an OpenRouter model that supports structured outputs
- When they submit a natural-language workflow prompt
- Then AutoM8 either asks Clarification Questions for missing Execution Blockers or creates a Draft Automation with a title, summary, ordered steps, and Draft Step Details
- And AutoM8 sends Clarification Answers back with the question ID, question text, reason, and answer while blocking draft creation until answers are present and sufficient
- And each Clarification Question includes an answer kind so the UI can choose the correct answer control without changing the Clarification Answer payload
- And AutoM8 makes one bounded repair request for parsed JSON, schema, or semantic failures, including meta/status nodes or unresolved Execution Blockers, before showing safe diagnostics without exposing raw provider payloads
- And graph inspection of the draft is owned by `documentation/vertical-slices/node-graph-viewer/inspect-automation-graph.md`
